import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl, S3_TEMP_BUCKET, uploadToS3, removeFromS3 } from "../../../helpers/s3.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { getFormattedTimestamp } from "../../../helpers/utils.js";


const updateEmployeeProfilePicture = async (req, res) => {
    const { id } = req.query;
    const imageFile = req.files?.image?.[0];

    let client;
    
    try {
        client = await pool.connect();

        const fileErrors = {};
        const imageValidationErrors = validateFile({
            file: imageFile,
            name: "image",
            allowedTypes: ["image/jpeg", "image/png", "image/jpg", "image/svg"],
            maxSizeMB: 5,
        });

        Object.assign(fileErrors, imageValidationErrors || {});

        if (Object.keys(fileErrors).length > 0) {
            return res.status(400).json(fileErrors);
        }

        await client.query("BEGIN");

        const employee = await client.query("SELECT * FROM eSparkTalentAPI_employee WHERE id = $1", [id]);

        if (!employee.rows[0]) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Employee not found" });
        }

        let imageS3Key = null;
        let oldImageS3Key = employee.rows[0].image;

        try {
            if (imageFile) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(imageFile.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/employees/profiles/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(imageFile.path);
                await uploadToS3(s3ImageKey, fileContent, imageFile.mimetype);
                fs.unlinkSync(imageFile.path);

                imageS3Key = s3ImageKey;
            }

        } catch (uploadError) {
            await client.query("ROLLBACK");
            fs.unlinkSync(imageFile.path);
            logger.error(`S3 upload error: ${uploadError}`);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (oldImageS3Key) {
            try {
                await removeFromS3(oldImageS3Key);
            } catch (removeError) {
                logger.error(`S3 removal error: ${removeError}`);
            }
        }

        let imageUrl = null;
        if (imageS3Key) {
            try {
                imageUrl = await getSignedUrl(imageS3Key);
            } catch (error) {
                logger.warn("Failed to generate signed URL for image:", error);
            }
        }

        await client.query("UPDATE eSparkTalentAPI_employee SET image = $1 WHERE id = $2", [imageS3Key, id]);

        await client.query("COMMIT");

        return res.status(200).json({ message: "Profile picture updated successfully", image: imageUrl });

    } catch (error) {
        logger.error(`Error updating employee profile picture: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
}

export default updateEmployeeProfilePicture;
