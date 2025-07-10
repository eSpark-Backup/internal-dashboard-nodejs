import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateInterviewSchedule = async (req, res) => {
    const { id } = req.query;
    const { status } = req.body || {};

    try {
        const interviewSchedule = await pool.query("SELECT id FROM eSparkTalentAPI_interview_schedule WHERE id = $1", [id]);

        if (interviewSchedule.rowCount === 0) {
            return res.status(404).json({ message: "Interview schedule not found with given id" });
        }

        const updatedInterviewSchedule = await pool.query(
            `UPDATE eSparkTalentAPI_interview_schedule
                SET status = $2
             WHERE id = $1`,
            [id, status]
        );

        if (updatedInterviewSchedule.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update interview schedule" });
        }

        return res.status(200).json({ message: `Interview schedule updated successfully with ${status} status` });
    } catch (error) {
        logger.error(`Error updating interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateInterviewSchedule
