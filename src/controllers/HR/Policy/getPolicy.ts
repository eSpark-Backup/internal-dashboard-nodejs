import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getPolicy = async (req, res) => {
    try {
        const policyResult = await pool.query(
            `SELECT id, policy_name, description, employee, client FROM eSparkTalentAPI_policy`
        );

        return res.status(200).json(policyResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getPolicy;
