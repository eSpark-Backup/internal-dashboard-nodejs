import pool from "../../config/db.js";
import { logger } from "../../helpers/logger.js";
import payfastService from "../../services/payfast/payfast.service.js";

/**
 * Monthly Invoice Generator
 * Runs on the 1st of every month at 2:00 AM
 * Generates salary invoices for all active outsourced employees
 */
const generateMonthlyInvoices = async () => {
  const client = await pool.connect();

  try {
    logger.info("Starting monthly invoice generation...");

    await client.query("BEGIN");

    // Get current date info
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYear = now.getFullYear();
    const currentMonthNumber = now.getMonth() + 1;

    // Check if invoices already generated for this month
    const existingInvoicesCheck = await client.query(
      `SELECT COUNT(*) as count 
       FROM eSparkTalentAPI_employee_invoice 
       WHERE billing_month = $1 AND invoice_type = 'SALARY'`,
      [currentMonth],
    );

    if (parseInt(existingInvoicesCheck.rows[0].count) > 0) {
      logger.warn(
        `Salary invoices already generated for ${currentMonth.toISOString().split("T")[0]}`,
      );
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Invoices already generated for this month",
      };
    }

    // Get all active outsourced employees with their client and salary info
    const employeesQuery = `
      SELECT 
        oe.id as outsource_id,
        oe.employee_id,
        oe.client_id,
        oe.salary,
        oe.joining_date,
        oe.status,
        e.first_name,
        e.last_name,
        e.email as employee_email,
        c.email as client_email,
        c.invoice_due_date,
        c.company_name
      FROM eSparkTalentAPI_outsource_employees oe
      JOIN eSparkTalentAPI_employee e ON oe.employee_id = e.id
      JOIN eSparkTalentAPI_client c ON oe.client_id = c.id
      WHERE oe.status = 'active'
    `;

    const employeesResult = await client.query(employeesQuery);
    const employees = employeesResult.rows;

    if (employees.length === 0) {
      logger.info("No active outsourced employees found");
      await client.query("COMMIT");
      return {
        success: true,
        message: "No invoices to generate",
        count: 0,
      };
    }

    logger.info(`Found ${employees.length} active outsourced employees`);

    const generatedInvoices = [];
    const errors = [];

    // Generate invoice for each employee
    for (const employee of employees) {
      try {
        // Calculate invoice dates
        const invoiceDate = now;
        const dueDay = employee.invoice_due_date || 31;

        // Calculate due date for current month
        const lastDayOfMonth = new Date(
          currentYear,
          currentMonthNumber,
          0,
        ).getDate();
        const dueDateDay = Math.min(dueDay, lastDayOfMonth);
        const dueDate = new Date(
          currentYear,
          currentMonthNumber - 1,
          dueDateDay,
        );

        // Handle prorated salary if employee joined mid-month
        let invoiceAmount = parseFloat(employee.salary);
        const joiningDate = new Date(employee.joining_date);
        const isFirstMonth =
          joiningDate.getMonth() === now.getMonth() &&
          joiningDate.getFullYear() === now.getFullYear();

        if (isFirstMonth && joiningDate.getDate() > 1) {
          // Prorate salary based on days worked
          const totalDaysInMonth = lastDayOfMonth;
          const daysWorked = totalDaysInMonth - joiningDate.getDate() + 1;
          invoiceAmount = (employee.salary / totalDaysInMonth) * daysWorked;
          logger.info(
            `Prorated salary for ${employee.first_name} ${employee.last_name}: ${invoiceAmount.toFixed(2)}`,
          );
        }

        // Generate unique basket_id
        const basketId = payfastService.generateBasketId(
          `${employee.employee_id}-${currentMonthNumber}`,
          "SALARY",
        );

        // Insert invoice
        const insertInvoiceQuery = `
          INSERT INTO eSparkTalentAPI_employee_invoice (
            client_id,
            employee_id,
            invoice_date,
            due_date,
            invoice_amount,
            invoice,
            currency,
            payment_status,
            is_payment_due,
            invoice_type,
            billing_month,
            basket_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `;

        const invoiceFileName = `salary_invoice_${employee.employee_id}_${currentYear}_${String(currentMonthNumber).padStart(2, "0")}.pdf`;

        const invoiceResult = await client.query(insertInvoiceQuery, [
          employee.client_id,
          employee.employee_id,
          invoiceDate,
          dueDate,
          invoiceAmount.toFixed(2),
          invoiceFileName,
          "PKR",
          "pending",
          true,
          "SALARY",
          currentMonth,
          basketId,
        ]);

        const invoiceId = invoiceResult.rows[0].id;

        generatedInvoices.push({
          invoiceId,
          employeeId: employee.employee_id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          clientId: employee.client_id,
          amount: invoiceAmount.toFixed(2),
          basketId,
        });

        // Create notification for client
        await createInvoiceNotification(
          client,
          employee.client_email,
          invoiceId,
          employee.first_name,
          employee.last_name,
          invoiceAmount,
          currentMonth,
        );

        // Create notification for HR
        const hrEmail = process.env.TALENT_EMAIL;
        if (hrEmail) {
          await createInvoiceNotification(
            client,
            hrEmail,
            invoiceId,
            employee.first_name,
            employee.last_name,
            invoiceAmount,
            currentMonth,
            true, // isHR flag
          );
        }

        logger.info(
          `Generated invoice ${invoiceId} for ${employee.first_name} ${employee.last_name}`,
        );
      } catch (error) {
        logger.error(
          `Error generating invoice for employee ${employee.employee_id}:`,
          error,
        );
        errors.push({
          employeeId: employee.employee_id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          error: error.message,
        });
      }
    }

    await client.query("COMMIT");

    const summary = {
      success: true,
      message: "Monthly invoice generation completed",
      totalEmployees: employees.length,
      invoicesGenerated: generatedInvoices.length,
      errors: errors.length,
      month: currentMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      generatedInvoices,
      errors,
    };

    logger.info(
      `Monthly invoice generation completed: ${generatedInvoices.length} invoices generated, ${errors.length} errors`,
    );

    return summary;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Monthly invoice generation failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create notification for invoice generation
 */
const createInvoiceNotification = async (
  client,
  email,
  invoiceId,
  employeeFirstName,
  employeeLastName,
  amount,
  billingMonth,
  isHR = false,
) => {
  try {
    const monthName = new Date(billingMonth).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const description = isHR
      ? `Salary invoice auto-generated for ${employeeFirstName} ${employeeLastName} - ${monthName}. Amount: PKR ${amount}`
      : `Salary Invoice issued for ${employeeFirstName} ${employeeLastName} - ${monthName}. Amount: PKR ${amount}. Please proceed with payment.`;

    const notificationQuery = `
      INSERT INTO eSparkTalentAPI_notifications 
        (email, ref_id, notification_type, description, status)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await client.query(notificationQuery, [
      email,
      invoiceId,
      "salary_invoice",
      description,
      "pending",
    ]);
  } catch (error) {
    logger.error("Failed to create invoice notification:", error);
  }
};

export default generateMonthlyInvoices;
