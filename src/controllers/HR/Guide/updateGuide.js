import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import path from "path";
import fs from "fs";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";



const updateGuide = async (req, res) => {
    const { id } = req.query;
    const { guide_name, language, description } = req.body || {};
    const guide_doc = req.files?.guide_doc?.[0];

    if (!guide_name && !language && !description && !guide_doc) {
        return res.status(400).json({ message: "Missing guide name or language or description or guide document" });
    }

    try {
        const guide = await pool.query(
            `SELECT * FROM eSparkTalentAPI_guide WHERE id = $1`,
            [id]
        );

        if (guide.rowCount === 0) {
            await cleanupFiles([{ localPath: guide_doc?.path }]);
            return res.status(404).json({ message: "Guide with given id not found" });
        }

        let guide_doc_url = guide.rows[0].guide_doc;

        try {
            if (guide_doc) {
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

                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(guide_doc.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/guides/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(guide_doc.path);
                await uploadToS3(s3ImageKey, fileContent, guide_doc.mimetype);
                await cleanupFiles([{ localPath: guide_doc?.path }]);

                guide_doc_url = s3ImageKey;
            }
        }
        catch (error) {
            logger.error(error);
            await cleanupFiles([{ localPath: guide_doc?.path }]);
            return res.status(500).json({ message: "Internal server error" });
        }

        const updatedGuide = await pool.query(
            `UPDATE eSparkTalentAPI_guide 
            SET guide_name = COALESCE($1, guide_name),
                language = COALESCE($2, language),
                description = COALESCE($3, description),
                guide_doc = COALESCE($4, guide_doc),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5`,
            [guide_name, language, description, guide_doc_url, id]
        );

        if (updatedGuide.rowCount === 0) {
            await cleanupFiles([{ localPath: guide_doc?.path }]);
            return res.status(400).json({ message: "Failed to update guide" });
        }

        return res.status(200).json({ message: "Guide updated successfully" });

    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export default updateGuide;
