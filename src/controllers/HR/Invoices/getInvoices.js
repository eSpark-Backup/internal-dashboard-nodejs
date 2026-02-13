import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getInvoices = async (req, res) => {
  const excludedEmail = process.env.TALENT_EMAIL;
  const { client_id, payment_status, invoice_type, start_date, end_date } =
    req.query || {};

  try {
    // If no filters provided, return client list as before
    if (
      !client_id &&
      !payment_status &&
      !invoice_type &&
      !start_date &&
      !end_date
    ) {
      const Invoices = await pool.query(
        `
                SELECT 
                    c.id,
                    c.company_name,
                    c.client_id,
                    c.email,
                    eu.is_active
                FROM eSparkTalentAPI_client AS c
                LEFT JOIN eSparkTalentAPI_end_user AS eu
                    ON c.email = eu.email
                WHERE c.email != $1
            `,
        [excludedEmail],
      );

      return res.status(200).json(Invoices.rows);
    }

    // Build dynamic query for filtered invoice data
    const conditions = ["c.email != $1"];
    const params = [excludedEmail];
    let paramCount = 1;

    if (client_id) {
      paramCount++;
      conditions.push(`ei.client_id = $${paramCount}`);
      params.push(client_id);
    }

    if (payment_status) {
      paramCount++;
      conditions.push(`ei.payment_status = $${paramCount}`);
      params.push(payment_status);
    }

    if (start_date) {
      paramCount++;
      conditions.push(`ei.invoice_date >= $${paramCount}`);
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      conditions.push(`ei.invoice_date <= $${paramCount}`);
      params.push(end_date);
    }

    const whereClause = conditions.join(" AND ");

    let employeeInvoices = [];
    let customInvoices = [];

    // Fetch employee invoices (salary)
    if (!invoice_type || invoice_type === "SALARY") {
      const employeeInvoicesQuery = `
                SELECT 
                    ei.id,
                    ei.client_id,
                    ei.employee_id,
                    TO_CHAR(ei.invoice_date, 'YYYY-MM-DD') as invoice_date,
                    TO_CHAR(ei.due_date, 'YYYY-MM-DD') as due_date,
                    TO_CHAR(ei.billing_month, 'YYYY-MM-DD') as billing_month,
                    ei.invoice_amount,
                    ei.currency,
                    ei.payment_status,
                    ei.is_payment_due,
                    ei.invoice_type,
                    ei.basket_id,
                    ei.payment_method,
                    ei.payment_reference,
                    TO_CHAR(ei.paid_at, 'YYYY-MM-DD HH24:MI:SS') as paid_at,
                    c.company_name,
                    c.email as client_email,
                    c.first_name || ' ' || c.last_name as client_name,
                    e.first_name || ' ' || e.last_name as employee_name,
                    e.employee_id as employee_code,
                    e.email as employee_email,
                    CASE 
                        WHEN ei.payment_status != 'paid' AND ei.due_date < CURRENT_DATE THEN true
                        ELSE false
                    END as is_overdue
                FROM eSparkTalentAPI_employee_invoice ei
                LEFT JOIN eSparkTalentAPI_client c ON ei.client_id = c.id
                LEFT JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
                WHERE ${whereClause}
                ORDER BY ei.created_at DESC
            `;

      const employeeResult = await pool.query(employeeInvoicesQuery, params);
      employeeInvoices = employeeResult.rows;
    }

    // Fetch custom invoices (other payments)
    if (!invoice_type || invoice_type === "CUSTOM") {
      const customInvoicesQuery = `
                SELECT 
                    op.id,
                    op.client_id,
                    op.invoice_reference,
                    TO_CHAR(op.invoice_date, 'YYYY-MM-DD') as invoice_date,
                    TO_CHAR(op.due_date, 'YYYY-MM-DD') as due_date,
                    op.invoice_amount,
                    op.currency,
                    op.payment_status,
                    op.is_payment_due,
                    op.basket_id,
                    op.payment_method,
                    op.payment_reference,
                    TO_CHAR(op.paid_at, 'YYYY-MM-DD HH24:MI:SS') as paid_at,
                    c.company_name,
                    c.email as client_email,
                    c.first_name || ' ' || c.last_name as client_name,
                    CASE 
                        WHEN op.payment_status != 'paid' AND op.due_date < CURRENT_DATE THEN true
                        ELSE false
                    END as is_overdue
                FROM eSparkTalentAPI_other_payment op
                LEFT JOIN eSparkTalentAPI_client c ON op.client_id = c.id
                WHERE ${whereClause}
                ORDER BY op.created_at DESC
            `;

      const customResult = await pool.query(customInvoicesQuery, params);
      customInvoices = customResult.rows;
    }

    // Calculate statistics
    const allInvoices = [...employeeInvoices, ...customInvoices];

    const totalAmount = allInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.invoice_amount || 0),
      0,
    );

    const totalPaid = allInvoices
      .filter((inv) => inv.payment_status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.invoice_amount || 0), 0);

    const totalUnpaid = allInvoices
      .filter((inv) => inv.payment_status !== "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.invoice_amount || 0), 0);

    const paidCount = allInvoices.filter(
      (inv) => inv.payment_status === "paid",
    ).length;
    const unpaidCount = allInvoices.filter(
      (inv) => inv.payment_status !== "paid",
    ).length;
    const overdueCount = allInvoices.filter(
      (inv) => inv.is_overdue === true,
    ).length;

    return res.status(200).json({
      employee_invoices: employeeInvoices,
      other_payments: customInvoices,
      statistics: {
        total_amount: parseFloat(totalAmount.toFixed(2)),
        total_paid: parseFloat(totalPaid.toFixed(2)),
        total_unpaid: parseFloat(totalUnpaid.toFixed(2)),
        paid_count: paidCount,
        unpaid_count: unpaidCount,
        overdue_count: overdueCount,
        total_invoices: allInvoices.length,
      },
    });
  } catch (err) {
    logger.error(`Error fetching Invoices: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }
};

export default getInvoices;
