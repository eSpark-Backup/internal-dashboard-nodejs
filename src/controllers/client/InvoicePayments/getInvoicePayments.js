import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getInvoicePayments = async (req, res) => {
    const { email } = req.user || {};
    const { payment_status } = req.query || {};

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "client does not exist with logged email" });
        }

        const clientId = clientResult.rows[0].id;

        let employeeInvoicesQuery = `
            SELECT 
                ei.id, 
                e.first_name || ' ' || e.last_name as employee_name,
                TO_CHAR(ei.invoice_date, 'YYYY-MM-DD') as invoice_date, 
                TO_CHAR(ei.due_date, 'YYYY-MM-DD') as due_date, 
                ei.invoice_amount, 
                ei.currency, 
                ei.payment_status
            FROM eSparkTalentAPI_employee_invoice ei
            JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
            WHERE ei.client_id = $1
        `;

        const employeeInvoicesQueryParams = [clientId];

        if (payment_status) {
            employeeInvoicesQuery += ` AND ei.payment_status = $2`;
            employeeInvoicesQueryParams.push(payment_status);
        }

        let invoicePaymentsQuery = `
            SELECT 
                id, 
                invoice_reference, 
                TO_CHAR(invoice_date, 'YYYY-MM-DD') as invoice_date, 
                TO_CHAR(due_date, 'YYYY-MM-DD') as due_date, 
                invoice_amount, 
                currency, 
                payment_status
            FROM eSparkTalentAPI_other_payment
            WHERE client_id = $1
        `;

        const invoicePaymentsQueryParams = [clientId];

        if (payment_status) {
            invoicePaymentsQuery += ` AND payment_status = $2`;
            invoicePaymentsQueryParams.push(payment_status);
        }


        const [employeeInvoicesResult, invoicePaymentsResult] = await Promise.all([
            pool.query(employeeInvoicesQuery, employeeInvoicesQueryParams),
            pool.query(invoicePaymentsQuery, invoicePaymentsQueryParams)
        ]);


        return res.status(200).json({
            employee_invoices: employeeInvoicesResult.rows,
            other_payments: invoicePaymentsResult.rows
        });

    } catch (error) {
        logger.error(`Error getting invoice payments: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getInvoicePayments;
