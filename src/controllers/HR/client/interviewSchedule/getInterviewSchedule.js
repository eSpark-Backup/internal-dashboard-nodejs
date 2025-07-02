import { logger } from "../../../../helpers/logger.js";
import pool from "../../../../config/db.js";

const getInterviewSchedule = async (req, res) => {
    const { id } = req.query;

    try {
        const interviewScheduleResult = await pool.query(
            `SELECT id, employee_name, gender, job_title, role_type, employment_term, interview_date_time, country, status FROM eSparkTalentAPI_interview_schedule WHERE client_id = $1`,
            [id]
        );


        return res.status(200).json(interviewScheduleResult.rows);
    } catch (error) {
        logger.error(`Error getting interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
}




export default getInterviewSchedule;