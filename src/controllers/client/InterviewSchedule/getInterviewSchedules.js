import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getInterviewSchedules = async (req, res) => {
    const { email } = req.user;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "client does not exist with logged email" });
        }

        const interviewScheduleResult = await pool.query(
            `SELECT 
             id, employee_name, gender, job_title, role_type, employment_term, interview_date_time, country, status
             FROM eSparkTalentAPI_interview_schedule
             WHERE client_id = $1`,
            [clientResult.rows[0].id]
        );

        return res.status(200).json(interviewScheduleResult.rows);
    } catch (error) {
        logger.error(`Error getting interview schedule: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getInterviewSchedules;
