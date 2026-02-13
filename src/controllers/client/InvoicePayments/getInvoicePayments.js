import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getInvoicePayments = async (req, res) => {
  const { email } = req.user || {};
  const { payment_status } = req.query || {};

  try {
    const clientResult = await pool.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [email],
    );

    if (clientResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "client does not exist with logged email" });
    }

    const clientId = clientResult.rows[0].id;

    let employeeInvoicesQuery = `
            SELECT 
                ei.id, 
                e.first_name || ' ' || e.last_name as employee_name,
                e.employee_id as employee_code,
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
                CASE 
                    WHEN ei.payment_status != 'paid' AND ei.due_date < CURRENT_DATE THEN true
                    ELSE false
                END as is_overdue,
                CASE 
                    WHEN ei.payment_status != 'paid' AND ei.is_payment_due = true THEN true
                    ELSE false
                END as can_pay
            FROM eSparkTalentAPI_employee_invoice ei
            JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
            WHERE ei.client_id = $1
        `;

    const employeeInvoicesQueryParams = [clientId];

    if (payment_status) {
      employeeInvoicesQuery += ` AND ei.payment_status = $2`;
      employeeInvoicesQueryParams.push(payment_status);
    }

    employeeInvoicesQuery += ` ORDER BY ei.created_at DESC`;

    let invoicePaymentsQuery = `
            SELECT 
                id, 
                invoice_reference, 
                TO_CHAR(invoice_date, 'YYYY-MM-DD') as invoice_date, 
                TO_CHAR(due_date, 'YYYY-MM-DD') as due_date, 
                invoice_amount, 
                currency, 
                payment_status,
                is_payment_due,
                basket_id,
                payment_method,
                payment_reference,
                TO_CHAR(paid_at, 'YYYY-MM-DD HH24:MI:SS') as paid_at,
                CASE 
                    WHEN payment_status != 'paid' AND due_date < CURRENT_DATE THEN true
                    ELSE false
                END as is_overdue,
                CASE 
                    WHEN payment_status != 'paid' AND is_payment_due = true THEN true
                    ELSE false
                END as can_pay
            FROM eSparkTalentAPI_other_payment
            WHERE client_id = $1
        `;

    const invoicePaymentsQueryParams = [clientId];

    if (payment_status) {
      invoicePaymentsQuery += ` AND payment_status = $2`;
      invoicePaymentsQueryParams.push(payment_status);
    }

    invoicePaymentsQuery += ` ORDER BY created_at DESC`;

    const [employeeInvoicesResult, invoicePaymentsResult] = await Promise.all([
      pool.query(employeeInvoicesQuery, employeeInvoicesQueryParams),
      pool.query(invoicePaymentsQuery, invoicePaymentsQueryParams),
    ]);

    // Calculate statistics
    const allInvoices = [
      ...employeeInvoicesResult.rows,
      ...invoicePaymentsResult.rows,
    ];

    const totalUnpaid = allInvoices
      .filter((inv) => inv.payment_status !== "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.invoice_amount || 0), 0);

    const unpaidCount = allInvoices.filter(
      (inv) => inv.payment_status !== "paid",
    ).length;
    const paidCount = allInvoices.filter(
      (inv) => inv.payment_status === "paid",
    ).length;
    const overdueCount = allInvoices.filter(
      (inv) => inv.is_overdue === true,
    ).length;

    return res.status(200).json({
      employee_invoices: employeeInvoicesResult.rows,
      other_payments: invoicePaymentsResult.rows,
      statistics: {
        total_unpaid: parseFloat(totalUnpaid.toFixed(2)),
        unpaid_count: unpaidCount,
        paid_count: paidCount,
        overdue_count: overdueCount,
        total_invoices: allInvoices.length,
      },
    });
  } catch (error) {
    logger.error(`Error getting invoice payments: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getInvoicePayments;
