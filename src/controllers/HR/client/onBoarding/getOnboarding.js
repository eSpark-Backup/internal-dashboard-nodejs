import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const getOnboarding = async (req, res) => {
    const { id } = req.query;
 
    try {
        const interviewScheduleResult = await pool.query(
            `SELECT id, employee_name, gender, country, job_title, role_type, employment_term, TO_CHAR(joining_date, 'YYYY-MM-DD') as joining_date, notice_period, salary, salary_currency FROM eSparkTalentAPI_onboarding WHERE client_id = $1`,
            [id]
        );


        return res.status(200).json(interviewScheduleResult.rows);
    } catch (error) {
        logger.error(`Error getting interview schedule: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
}




export default getOnboarding;