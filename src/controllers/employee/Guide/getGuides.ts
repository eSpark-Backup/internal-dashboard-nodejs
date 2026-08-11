import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getGuides = async (req, res) => {

    try {
        const policyResult = await pool.query(
            `SELECT id, guide_name, description, language FROM eSparkTalentAPI_guide WHERE employee = true`
        );

        return res.status(200).json(policyResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getGuides;
