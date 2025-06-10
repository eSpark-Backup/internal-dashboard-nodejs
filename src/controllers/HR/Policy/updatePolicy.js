import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import path from "path";
import fs from "fs";
import { getFormattedTimestamp } from "../../../helpers/utils.js";



const updatePolicy = async (req, res) => {
    const { id } = req.query;
    const { policy_name } = req.body;
    const policy_doc = req.files?.policy_doc?.[0];

    if (!policy_name && !policy_doc) {
        return res.status(400).json({ message: "Missing policy name or policy document" });
    }

    try {
        const policy = await pool.query(
            `SELECT * FROM eSparkTalentAPI_policy WHERE id = $1`,
            [id]
        );

        if (policy.rowCount === 0) {
            return res.status(404).json({ message: "Policy with given id not found" });
        }

        let policy_doc_url = policy.rows[0].policy_doc;

        try {
            if (policy_doc) {
                const fileErrors = {};
                const policyDocValidationErrors = validateFile({
                    file: policy_doc,
                    name: "policy_doc",
                    required: true,
                    allowedTypes: ["application/pdf"],
                    maxSizeMB: 5,
                });

                Object.assign(fileErrors, policyDocValidationErrors || {});

                if (Object.keys(fileErrors).length > 0) {
                    return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
                }

                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(policy_doc.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/policies/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(policy_doc.path);
                await uploadToS3(s3ImageKey, fileContent, policy_doc.mimetype);
                fs.unlinkSync(policy_doc.path);

                policy_doc_url = s3ImageKey;
            }
        }
        catch (error) {
            logger.error(error);
            if (policy_doc && fs.existsSync(policy_doc.path)) {
                fs.unlinkSync(policy_doc.path);
            }
            return res.status(500).json({ message: "Internal server error" });
        }

        const updatedPolicy = await pool.query(
            `UPDATE eSparkTalentAPI_policy 
            SET policy_name = COALESCE($1, policy_name),
                policy_doc = COALESCE($2, policy_doc),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3`,
            [policy_name, policy_doc_url, id]
        );

        if (updatedPolicy.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update policy" });
        }

        return res.status(200).json({ message: "Policy updated successfully" });

    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export default updatePolicy;
