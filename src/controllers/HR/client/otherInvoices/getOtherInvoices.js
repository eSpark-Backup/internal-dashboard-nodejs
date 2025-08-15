import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const getOtherInvoices = async (req, res) => {
    const { client_id, tab } = req.query;

    const clientResult = await pool.query(
        `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
        [client_id]
    );

    if (!clientResult.rows[0]?.id) {
        return res.status(404).json({ message: "Client does not exist with the given client email" });
    }

    try {
        let query = `
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

        const queryParams = [clientResult.rows[0].id];

        if (tab) {
            query += ` AND payment_status = $2`;
            queryParams.push(tab);
        }

        const otherInvoicesResult = await pool.query(query, queryParams);

        return res.status(200).json(otherInvoicesResult.rows);
    } catch (error) {
        logger.error(`Error getting employee invoices: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getOtherInvoices;
