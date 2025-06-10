import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getGuide = async (req, res) => {
    try {
        const guideResult = await pool.query(
            `SELECT id, guide_name, description, language, employee, client FROM eSparkTalentAPI_guide`
        );

        return res.status(200).json(guideResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getGuide;
