import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const addPunchRequest = async (req, res) => {
    const { username, email } = req.user;
    const { date, client_id, punch_type, punch_time, description } = req.body || {};

    let client;

    try {
        
        client = await pool.connect();

        const employee = await client.query(`SELECT id, email FROM eSparkTalentAPI_employee WHERE email = $1`, [email]);

        if (!employee.rows[0]) {
            logger.error(`Employee with email ${email} not found`);
            return res.status(404).json({ message: "Employee not found" });
        }

        const clientResult = await client.query(`SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`, [client_id]);

        if (!clientResult.rows[0]) {
            logger.error(`Client with email ${client_id} not found`);
            return res.status(404).json({ message: "Client not found" });
        }

        client.query('BEGIN');

        const punchRequest = await client.query(`INSERT INTO eSparkTalentAPI_punch_request 
            (client_id, employee_id ,date, punch_type, punch_time, description, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [clientResult.rows[0].id, employee.rows[0].id, date, punch_type, punch_time, description, "pending"]
        );

        if (!punchRequest.rows[0]) {
            logger.error("Failed to add punch request");
            return res.status(400).json({ message: "Failed to add punch request" });
        }


        const notification = await client.query(
            `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [clientResult.rows[0].email, punchRequest.rows[0].id, "punch_request", `${username} ${punch_type} request is pending`, "added"]
        );

        if (!notification.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add notification" });
        }

        await client.query("COMMIT");


        logger.info(`Punch request added successfully for ${username}`);
        return res.status(200).json({ message: "check_in request is pending", id: punchRequest.rows[0].id });
    } catch (error) {
        logger.error(`Error adding punch request: ${error.message}`);
        await client.query("ROLLBACK");
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        if (client) client.release();
    }
}

export default addPunchRequest;