import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const downloadPolicy = async (req, res) => {
    const { id } = req.query;

    try {
        const policy = await pool.query("SELECT * FROM eSparkTalentAPI_policy WHERE id = $1", [id]);

        if (!policy.rows[0]) {
            return res.status(404).json({ message: "Policy with this id does not exist" });
        }

        const policyDoc = policy.rows[0].policy_doc;

        if (!policyDoc) {
            return res.status(404).json({ message: "Policy document not found" });
        }

        downloadFileFromS3(res, policyDoc, `policy.pdf`, "application/pdf");

    } catch (error) {
        logger.error(`Error getting policy document: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default downloadPolicy;
