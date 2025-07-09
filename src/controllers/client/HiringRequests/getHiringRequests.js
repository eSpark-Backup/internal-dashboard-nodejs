import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const getHiringRequests = async (req, res) => {
    const { email } = req.user;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "client does not exist with logged email" });
        }

        const hiringRequestsResult = await pool.query(
            `SELECT 
             id, job_title, role_type, gender, employment_term, salary_range, country, salary_currency, TO_CHAR(hiring_start_date, 'YYYY-MM-DD') AS hiring_start_date, TO_CHAR(hiring_end_date, 'YYYY-MM-DD') AS hiring_end_date, comments
             FROM eSparkTalentAPI_hiring_request
             WHERE client_id = $1`,
            [clientResult.rows[0].id]
        );

        return res.status(200).json(hiringRequestsResult.rows);
    } catch (error) {
        logger.error(`Error getting hiring requests: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getHiringRequests;
