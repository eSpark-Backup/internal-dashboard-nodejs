import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";


const deletePolicy = async (req, res) => {
    const { id } = req.query;

    try {
        const policy = await pool.query(
            `SELECT * FROM eSparkTalentAPI_policy WHERE id = $1`,
            [id]
        );

        if (policy.rowCount === 0) {
            return res.status(404).json({ message: "Policy with the given ID not found" });
        }

        const { policy_doc } = policy.rows[0];

        try {
            if (policy_doc) await removeFromS3(policy_doc);
        } catch (err) {
            logger.warn(`Failed to remove policy document from S3: ${err}`);
        }


        await pool.query(
            `DELETE FROM eSparkTalentAPI_policy WHERE id = $1`,
            [id]
        );

        return res.status(200).json({ message: "Policy deleted successfully" });
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export default deletePolicy;
