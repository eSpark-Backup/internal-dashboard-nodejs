import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const getGuides = async (req, res) => {

    try {
        const guideResult = await pool.query(
            `SELECT 
             id, guide_name, description, language
             FROM eSparkTalentAPI_guide WHERE client = true
             `);

        return res.status(200).json(guideResult.rows);
    } catch (error) {
        logger.error(`Error getting interview schedule: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getGuides;
