import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import bcrypt from "bcrypt";
import { validateFile } from "../../../utils/validateFiles.js";
import { checkClientDuplicates } from "../../../utils/client.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";
import { getSignedUrl, S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";


const addClient = async (req, res) => {
    const {
        client_id,
        company_name,
        address,
        first_name,
        last_name,
        join_date,
        phone_number,
        email,
        country,
        password,
    } = req.body || {};

    const imageFile = req.files?.image?.[0];

    let client;
    let imageS3Key = null;

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
            await cleanupFiles([{ localPath: imageFile?.path }]);
            return res.status(400).json(fileErrors);
        }

        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT client_id, email
        FROM eSparkTalentAPI_client
        WHERE client_id = $1 OR email = $2`,
            [client_id, email]
        );

        const duplicateErrors = checkClientDuplicates(rows, {
            client_id,
            email,
        });

        if (Object.keys(duplicateErrors).length > 0) {
            await client.query("ROLLBACK");
            await cleanupFiles([{ localPath: imageFile?.path }]);
            return res.status(400).json(duplicateErrors);
        }

        const { rows: existingUser } = await client.query(
            `SELECT id FROM eSparkTalentAPI_end_user WHERE email = $1`,
            [email]
        );



        if (existingUser.length > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                email: ["User already exists with this email."],
            });
        }



        try {
            if (imageFile) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(imageFile.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/clients/profiles/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(imageFile.path);
                await uploadToS3(s3ImageKey, fileContent, imageFile.mimetype);
                await cleanupFiles([{ localPath: imageFile?.path }]);

                imageS3Key = s3ImageKey;
            }
        } catch (uploadError) {
            await client.query("ROLLBACK");
            await cleanupFiles([{ localPath: imageFile?.path }]);
            logger.error(`S3 upload error: ${uploadError}`);
            return res.status(500).json({ message: "Failed to upload image" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query(
            `INSERT INTO eSparkTalentAPI_end_user (username, email, password, role, is_superuser, is_active, is_staff)
             VALUES ($1, $2, $3, $4, false, true, false)`,
            [`${company_name}`, email, hashedPassword, "client"]
        );

        const clientResult = await client.query(
            `INSERT INTO eSparkTalentAPI_client (client_id, company_name, address, first_name, last_name, image, join_date, phone_number, email, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [client_id, company_name, address, first_name, last_name, imageS3Key, join_date, phone_number, email, country]
        );

        await client.query("COMMIT");

        let imageUrl = null;
        if (imageS3Key) {
            try {
                imageUrl = await getSignedUrl(imageS3Key);
            } catch (error) {
                logger.warn("Failed to generate signed URL for image:", error);
            }
        }

        logger.info(`${first_name} ${last_name} is added successfully`);
        return res.status(201).json({
            message: `${first_name} ${last_name} is added successfully`,
            id: clientResult.rows[0].id,
            image: imageUrl,
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK");
        await cleanupFiles([{ localPath: imageFile?.path }]);
        logger.error("Add client error:", error);
        return res.status(500).json({ message: "Failed to add client" });
    } finally {
        if (client) client.release();
    }
}

export default addClient;