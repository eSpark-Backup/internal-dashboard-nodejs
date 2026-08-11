import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";


const deleteInterviewSchedule = async (req, res) => {
    const { id } = req.query;

    let client;

    try {
        
        client = await pool.connect();

        const interviewSchedule = await client.query(
            `SELECT id FROM eSparkTalentAPI_interview_schedule WHERE id = $1`,
            [id]
        );

        if (interviewSchedule.rowCount === 0) {
            return res.status(404).json({ message: "Interview schedule does not exist with given id" });
        }

        await client.query("BEGIN");

        await client.query(
            `DELETE FROM eSparkTalentAPI_interview_schedule WHERE id = $1`,
            [id]
        );

        const notification = await client.query(
            `SELECT id FROM eSparkTalentAPI_notifications WHERE ref_id = $1 AND notification_type = 'interview_schedule'`,
            [id]
        );

        if (notification.rows[0]) {
            await client.query(
                `DELETE FROM eSparkTalentAPI_notifications WHERE ref_id = $1`,
                [id]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Interview schedule has been deleted" });

    } catch (error) {
        if (client) await client.query("ROLLBACK");
        logger.error(`Error deleting interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteInterviewSchedule;
