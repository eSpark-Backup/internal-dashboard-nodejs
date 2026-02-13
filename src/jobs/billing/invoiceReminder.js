import pool from "../../config/db.js";
import { logger } from "../../helpers/logger.js";

/**
 * Invoice Reminder
 * Runs daily to send reminders for upcoming due invoices
 * Sends reminder 3 days before due date
 */
const sendInvoiceReminders = async () => {
  const client = await pool.connect();

  try {
    logger.info("Starting invoice reminder check...");

    // Get current date and 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Get unpaid invoices due in 3 days
    const invoicesQuery = `
      SELECT 
        ei.id,
        ei.due_date,
        ei.invoice_amount,
        ei.invoice_type,
        ei.billing_month,
        c.email as client_email,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
      FROM eSparkTalentAPI_employee_invoice ei
      JOIN eSparkTalentAPI_client c ON ei.client_id = c.id
      LEFT JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
      WHERE ei.payment_status != 'paid'
        AND ei.is_payment_due = true
        AND ei.due_date::date = $1::date
    `;

    const invoicesResult = await client.query(invoicesQuery, [
      threeDaysFromNow,
    ]);
    const invoices = invoicesResult.rows;

    if (invoices.length === 0) {
      logger.info("No invoices require reminders today");
      return { success: true, count: 0 };
    }

    logger.info(`Found ${invoices.length} invoices requiring reminders`);

    for (const invoice of invoices) {
      try {
        const monthName = invoice.billing_month
          ? new Date(invoice.billing_month).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "";

        const employeeName = invoice.employee_first_name
          ? `${invoice.employee_first_name} ${invoice.employee_last_name}`
          : "N/A";

        const description = `Payment reminder: Invoice for ${employeeName} - ${monthName} is due in 3 days (${new Date(invoice.due_date).toLocaleDateString()}). Amount: PKR ${invoice.invoice_amount}`;

        const notificationQuery = `
          INSERT INTO eSparkTalentAPI_notifications 
            (email, ref_id, notification_type, description, status)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await client.query(notificationQuery, [
          invoice.client_email,
          invoice.id,
          "payment_reminder",
          description,
          "pending",
        ]);

        logger.info(`Sent reminder for invoice ${invoice.id}`);
      } catch (error) {
        logger.error(
          `Error sending reminder for invoice ${invoice.id}:`,
          error,
        );
      }
    }

    logger.info(`Invoice reminders sent: ${invoices.length}`);

    return {
      success: true,
      count: invoices.length,
    };
  } catch (error) {
    logger.error("Invoice reminder process failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

export default sendInvoiceReminders;
