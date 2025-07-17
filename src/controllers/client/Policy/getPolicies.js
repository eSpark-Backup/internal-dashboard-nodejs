import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const getPolicies = async (req, res) => {
    try {
        const policyResult = await pool.query(
            `SELECT 
             id, policy_name, description
             FROM eSparkTalentAPI_policy WHERE client = true
             `);

        return res.status(200).json(policyResult.rows);
    } catch (error) {
        logger.error(`Error getting policies: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getPolicies;
