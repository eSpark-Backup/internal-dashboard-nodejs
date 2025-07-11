import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const getOnboardings = async (req, res) => {
    const { email } = req.user;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "client does not exist with logged email" });
        }

        const onboardingsResult = await pool.query(
            `SELECT 
             employee_name, gender, country, job_title, role_type, employment_term, TO_CHAR(joining_date, 'YYYY-MM-DD') AS joining_date, notice_period, salary, salary_currency
             FROM eSparkTalentAPI_onboarding
             WHERE client_id = $1`,
            [clientResult.rows[0].id]
        );

        return res.status(200).json(onboardingsResult.rows);
    } catch (error) {
        logger.error(`Error getting onboardings: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getOnboardings;
