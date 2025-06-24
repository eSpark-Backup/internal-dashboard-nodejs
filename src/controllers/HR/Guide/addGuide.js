import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import path from "path";
import fs from "fs";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";


const addGuide = async (req, res) => {

    try {
        const { guide_name, language, description } = req.body || {};
        const guide_doc = req.files?.guide_doc?.[0];

        const fileErrors = {};
        const guideDocValidationErrors = validateFile({
            file: guide_doc,
            name: "guide_doc",
            required: true,
            allowedTypes: ["application/pdf"],
            maxSizeMB: 5,
        });

        Object.assign(fileErrors, guideDocValidationErrors || {});

        if (Object.keys(fileErrors).length > 0) {
            await cleanupFiles([{ localPath: guide_doc?.path }]);
            return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
        }

        let guideDocUrl = null;

        try {
            if (guide_doc) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(guide_doc.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/guides/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(guide_doc.path);
                await uploadToS3(s3ImageKey, fileContent, guide_doc.mimetype);
                await cleanupFiles([{ localPath: guide_doc?.path }]);

                guideDocUrl = s3ImageKey;
            }
        }
        catch (error) {
            logger.error(`Error uploading guide document: ${error.message}`);
            await cleanupFiles([{ localPath: guide_doc?.path }]);
            return res.status(500).json({ message: "Internal server error" });
        }

        const guideResult = await pool.query(
            `INSERT INTO eSparkTalentAPI_guide (guide_name, description, language, guide_doc, employee, client) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [guide_name, description, language, guideDocUrl, false, false]
        );

        if (!guideResult.rows[0].id) {
            await cleanupFiles([{ localPath: guide_doc?.path, s3Key: guideDocUrl }]);
            return res.status(400).json({ message: "Failed to add guide" });
        }

        return res.status(200).json({ message: "New guide has been added successfully", id: guideResult.rows[0].id });
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export default addGuide;

