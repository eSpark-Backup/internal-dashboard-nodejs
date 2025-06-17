import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getBenefits = async (req, res) => {
    const { email } = req.user || {};

    try {
        const benefitsResult = await pool.query(
            `SELECT 
            eb.id, 
            eb.card_id, 
            eb.benefit, 
            TO_CHAR(eb.issue_date, 'YYYY-MM-DD') as issue_date, 
            eb.description 
            FROM eSparkTalentAPI_benefits eb JOIN eSparkTalentAPI_employee e ON eb.employee_id = e.id WHERE e.email = $1`, [email]
        );
        return res.status(200).json(benefitsResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getBenefits;
