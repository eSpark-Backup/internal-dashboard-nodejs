import { logger } from "../../../../helpers/logger.js";
import pool from "../../../../config/db.js";

const getInterviewSchedule = async (req, res) => {
    const { id } = req.query;

    try {
        // Convert interview_date_time to Asia/Karachi timezone before formatting
        const interviewScheduleResult = await pool.query(
            `SELECT id, employee_name, gender, job_title, role_type, employment_term, 
                TO_CHAR(interview_date_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi', 'YYYY-MM-DD HH24:MI:SS') as interview_date_time, 
                country, status 
             FROM eSparkTalentAPI_interview_schedule 
             WHERE client_id = $1`,
            [id]
        );

        return res.status(200).json(interviewScheduleResult.rows);
    } catch (error) {
        logger.error(`Error getting interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getInterviewSchedule;