import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";


const updateOnboarding = async (req, res) => {
    const { id } = req.query;
    const { employee_name, job_title, joining_date, notice_period, salary, gender, role_type, employment_term, country, salary_currency } = req.body || {};

    try {
        const onboardingResult = await pool.query("SELECT id FROM eSparkTalentAPI_onboarding WHERE id = $1", [id]);

        if (onboardingResult.rowCount === 0) {
            return res.status(404).json({ message: "Onboarding not found with given id" });
        }

        const updatedOnboarding = await pool.query(
            `UPDATE eSparkTalentAPI_onboarding
                SET 
                    employee_name = COALESCE($2, employee_name),
                    job_title     = COALESCE($3, job_title),
                    joining_date = COALESCE($4, joining_date),
                    notice_period = COALESCE($5, notice_period),
                    salary = COALESCE($6, salary),
                    gender        = COALESCE($7, gender),
                    role_type     = COALESCE($8, role_type),
                    employment_term = COALESCE($9, employment_term),
                    country       = COALESCE($10, country),
                    salary_currency = COALESCE($11, salary_currency),
                    updated_at    = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, employee_name, job_title, joining_date, notice_period, salary, gender, role_type, employment_term, country, salary_currency]
        );

        if (updatedOnboarding.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update onboarding" });
        }

        return res.status(200).json({ message: "Onboarding updated successfully" });
    } catch (error) {
        logger.error(`Error updating onboarding: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateOnboarding
