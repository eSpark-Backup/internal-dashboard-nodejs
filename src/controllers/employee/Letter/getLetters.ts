import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getLetters = async (req, res) => {
    const { email } = req.user || {};

    try {
        const policyResult = await pool.query(
            `SELECT id, objective, TO_CHAR(issue_date, 'YYYY-MM-DD') as issue_date FROM eSparkTalentAPI_letter WHERE email = $1`, [email]
        );

        return res.status(200).json(policyResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getLetters;
