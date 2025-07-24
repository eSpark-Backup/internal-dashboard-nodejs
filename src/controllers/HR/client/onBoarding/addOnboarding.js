import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const addOnboarding = async (req, res) => {

    const { client_id, employee_name, job_title, joining_date, notice_period, salary, gender, role_type, employment_term, country, salary_currency } = req.body || {};
    let client;

    try {
        client = await pool.connect();

        const clientResult = await client.query(
            `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1 `,
            [client_id]
        );

        if (!clientResult.rows[0]?.id) {
            return res.status(404).json({ message: "Client does not exist with given client email" });
        }

        await client.query("BEGIN");

        const onboarding = await client.query(
            `INSERT INTO eSparkTalentAPI_onboarding (client_id, employee_name, job_title, joining_date, notice_period, salary, gender, role_type, employment_term, country, salary_currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [clientResult.rows[0].id, employee_name, job_title, joining_date, notice_period, salary, gender, role_type, employment_term, country, salary_currency]
        );

        if (!onboarding.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add onboarding" });
        }

        const notification = await client.query(
            `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [clientResult.rows[0].email, onboarding.rows[0].id, "onboarding", `${employee_name} is onboarded for ${job_title} position`, "added"]
        );

        if (!notification.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add notification" });
        }

        await client.query("COMMIT");

        return res.status(200).json({ message: `You have successfully added ${employee_name} onboarded for ${job_title} position`, id: onboarding.rows[0].id });

    } catch (error) {
        logger.error(`Error adding onboarding: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }


}

export default addOnboarding;