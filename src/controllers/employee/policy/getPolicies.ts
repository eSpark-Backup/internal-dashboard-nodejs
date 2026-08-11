import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getPolicies = async (req, res) => {

    try {
        const policyResult = await pool.query(
            `SELECT id, policy_name, description FROM eSparkTalentAPI_policy WHERE employee = true`
        );

        return res.status(200).json(policyResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getPolicies;
