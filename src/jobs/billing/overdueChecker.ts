import pool from "../../config/db.js";
import { logger } from "../../helpers/logger.js";

/**
 * Overdue Invoice Checker
 * Runs daily to mark overdue invoices and send notifications
 */
const checkOverdueInvoices = async () => {
  const client = await pool.connect();

  try {
    logger.info("Starting overdue invoice check...");

    const now = new Date();

    // Get all unpaid invoices past due date
    const overdueQuery = `
      SELECT 
        ei.id,
        ei.due_date,
        ei.invoice_amount,
        ei.billing_month,
        ei.payment_status,
        c.email as client_email,
        c.first_name as client_first_name,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM eSparkTalentAPI_employee_invoice ei
      JOIN eSparkTalentAPI_client c ON ei.client_id = c.id
      LEFT JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
      WHERE ei.payment_status != 'paid'
        AND ei.due_date < $1
        AND ei.is_payment_due = true
    `;

    const overdueResult = await client.query(overdueQuery, [now]);
    const overdueInvoices = overdueResult.rows;

    if (overdueInvoices.length === 0) {
      logger.info("No overdue invoices found");
      return { success: true, count: 0 };
    }

    logger.info(`Found ${overdueInvoices.length} overdue invoices`);

    for (const invoice of overdueInvoices) {
      try {
        // Update payment status to processing (indicating overdue)
        if (invoice.payment_status === "pending") {
          await client.query(
            `UPDATE eSparkTalentAPI_employee_invoice 
             SET payment_status = 'processing' 
             WHERE id = $1`,
            [invoice.id],
          );
        }

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

        const monthName = invoice.billing_month
          ? new Date(invoice.billing_month).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "";

        const employeeName = invoice.employee_first_name
          ? `${invoice.employee_first_name} ${invoice.employee_last_name}`
          : "N/A";

        const description = `OVERDUE: Invoice for ${employeeName} - ${monthName} is ${daysOverdue} day(s) overdue. Due date: ${dueDate.toLocaleDateString()}. Amount: PKR ${invoice.invoice_amount}. Please pay immediately.`;

        // Check if notification already sent today
        const existingNotificationQuery = `
          SELECT id FROM eSparkTalentAPI_notifications
          WHERE ref_id = $1 
            AND notification_type = 'payment_overdue'
            AND created_at::date = $2::date
        `;

        const existingNotification = await client.query(
          existingNotificationQuery,
          [invoice.id, now],
        );

        // Only send notification once per day
        if (existingNotification.rows.length === 0) {
          const notificationQuery = `
            INSERT INTO eSparkTalentAPI_notifications 
              (email, ref_id, notification_type, description, status)
            VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(notificationQuery, [
            invoice.client_email,
            invoice.id,
            "payment_overdue",
            description,
            "pending",
          ]);

          // Also notify HR
          const hrEmail = process.env.TALENT_EMAIL;
          if (hrEmail) {
            await client.query(notificationQuery, [
              hrEmail,
              invoice.id,
              "payment_overdue",
              `Client overdue: ${description}`,
              "pending",
            ]);
          }

          logger.info(
            `Sent overdue notification for invoice ${invoice.id} (${daysOverdue} days overdue)`,
          );
        }
      } catch (error) {
        logger.error(`Error processing overdue invoice ${invoice.id}:`, error);
      }
    }

    logger.info(
      `Overdue check completed: ${overdueInvoices.length} overdue invoices processed`,
    );

    return {
      success: true,
      count: overdueInvoices.length,
    };
  } catch (error) {
    logger.error("Overdue invoice check failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

export default checkOverdueInvoices;
