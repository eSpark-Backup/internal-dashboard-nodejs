import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";


const updateInterviewSchedule = async (req, res) => {
    const { id } = req.query;
    const { employee_name, job_title, interview_date_time, gender, role_type, employment_term, country } = req.body || {};

    try {
        const interviewScheduleResult = await pool.query("SELECT id FROM eSparkTalentAPI_interview_schedule WHERE id = $1", [id]);

        if (interviewScheduleResult.rowCount === 0) {
            return res.status(404).json({ message: "Interview schedule not found with given id" });
        }

        const updatedInterviewSchedule = await pool.query(
            `UPDATE eSparkTalentAPI_interview_schedule
                SET 
                    employee_name = COALESCE($2, employee_name),
                    job_title     = COALESCE($3, job_title),
                    interview_date_time = COALESCE($4, interview_date_time),
                    gender        = COALESCE($5, gender),
                    role_type     = COALESCE($6, role_type),
                    employment_term = COALESCE($7, employment_term),
                    country       = COALESCE($8, country),
                    updated_at    = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, employee_name, job_title, interview_date_time, gender, role_type, employment_term, country]
        );

        if (updatedInterviewSchedule.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update interview schedule" });
        }

        return res.status(200).json({ message: "Interview schedule updated successfully" });
    } catch (error) {
        logger.error(`Error updating interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateInterviewSchedule
