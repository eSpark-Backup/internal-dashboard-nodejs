import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";


const addPolicy = async (req, res) => {

    try {
        const { policy_name } = req.body || {};
        const policy_doc = req.files?.policy_doc?.[0];

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
            await cleanupFiles([{ localPath: policy_doc?.path }]);
            return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
        }

        let policyDocUrl = null;

        try {
            if (policy_doc) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(policy_doc.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/policies/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(policy_doc.path);
                await uploadToS3(s3ImageKey, fileContent, policy_doc.mimetype);
                fs.unlinkSync(policy_doc.path);

                policyDocUrl = s3ImageKey;
            }
        }
        catch (error) {
            logger.error(`Error uploading policy document: ${error.message}`);
            if (policy_doc && fs.existsSync(policy_doc.path)) {
                fs.unlinkSync(policy_doc.path);
            }
            return res.status(500).json({ message: "Internal server error" });
        }

        const policyResult = await pool.query(
            `INSERT INTO eSparkTalentAPI_policy (policy_name, policy_doc, employee, client, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [policy_name, policyDocUrl, false, false, null]
        );

        if (!policyResult.rows[0].id) {
            return res.status(400).json({ message: "Failed to add policy" });
        }

        return res.status(200).json({ message: "New policy has been added successfully", id: policyResult.rows[0].id });
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export default addPolicy;

