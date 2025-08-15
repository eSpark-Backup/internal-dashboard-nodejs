import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const addInterviewSchedule = async (req, res) => {

    const { client_id, employee_name, job_title, interview_date_time, gender, role_type, employment_term, country } = req.body || {};
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

        const interviewSchedule = await client.query(
            `INSERT INTO eSparkTalentAPI_interview_schedule (client_id, employee_name, job_title, interview_date_time, gender, role_type, employment_term, country, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [clientResult.rows[0].id, employee_name, job_title, interview_date_time, gender, role_type, employment_term, country, "pending"]
        );

        if (!interviewSchedule.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add interview schedule" });
        }

        const notification = await client.query(
            `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [clientResult.rows[0].email, interviewSchedule.rows[0].id, "interview_schedule", `Interview of ${employee_name} is scheduled for ${job_title} position`, "added"]
        );

        if (!notification.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add notification" });
        }

        await client.query("COMMIT");

        return res.status(200).json({ message: "Interview schedule is scheduled", id: interviewSchedule.rows[0].id });

    } catch (error) {
        logger.error(`Error adding interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }


}

export default addInterviewSchedule;