import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";


const getBenefit = async (req, res) => {
    const { emp_email } = req.query;

    try {
        const employee = await pool.query(
            `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
            [emp_email]
        );

        if (!employee.rows[0]?.id) {
            return res.status(404).json({ message: "Employee does not exist with given employee email" });
        }

        const benefits = await pool.query(
            `SELECT id, card_id, benefit, TO_CHAR(issue_date, 'YYYY-MM-DD') as issue_date, description FROM eSparkTalentAPI_benefits WHERE employee_id = $1`,
            [employee.rows[0].id]
        );

        return res.status(200).json(benefits.rows);
    } catch (error) {
        logger.error(`Error fetching benefits: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getBenefit;
