import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getInvoices = async (req, res) => {
    const excludedEmail = process.env.TALENT_EMAIL;

    try {
        const Invoices = await pool.query(`
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
        `, [excludedEmail]);


        return res.status(200).json(Invoices.rows);
    } catch (err) {
        logger.error(`Error fetching Invoices: ${err.message}`);
        return res.status(400).json({ error: err.message });
    }
};

export default getInvoices;
