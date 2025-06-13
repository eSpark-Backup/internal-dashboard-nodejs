import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import { encrypt, getFormattedTimestamp } from "../../../helpers/utils.js";
import { getSignedUrl, S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";



const addAccount = async (req, res) => {
    const { account_name, email, password } = req.body || {};
    const imageFile = req.files?.image?.[0];

    let client;

    const fileErrors =
        validateFile({
            file: imageFile,
            name: "image",
            allowedTypes: ["image/png", "image/jpeg", "image/jpg"],
            maxSizeMB: 5,
        }) || {};

    if (Object.keys(fileErrors).length > 0) {
        return res.status(400).json(fileErrors);
    }

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const emailCheckQuery = `
        SELECT 'end_user' as source FROM eSparkTalentAPI_end_user WHERE email = $1
        UNION
        SELECT 'employee' as source FROM eSparkTalentAPI_employee WHERE email = $1
        UNION
        SELECT 'client' as source FROM eSparkTalentAPI_client WHERE email = $1
        `;

        const result = await client.query(emailCheckQuery, [email]);

        if (result.rows.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        let imageS3Key = null;

        try {
            if (imageFile) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(imageFile.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/accounts/profiles/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(imageFile.path);
                await uploadToS3(s3ImageKey, fileContent, imageFile.mimetype);
                fs.unlinkSync(imageFile.path);

                imageS3Key = s3ImageKey;
            }
        } catch (uploadError) {
            await client.query("ROLLBACK");
            if (imageFile && fs.existsSync(imageFile.path)) {
                fs.unlinkSync(imageFile.path);
            }
            logger.error(`S3 upload error: ${uploadError}`);
            return res.status(500).json({ message: "Internal server error" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const endUserResult = await client.query(
            `INSERT INTO eSparkTalentAPI_end_user (username, email, password, role, is_superuser, is_active, is_staff)
       VALUES ($1, $2, $3, $4, false, true, false) RETURNING *`,
            [account_name, email, hashedPassword, account_name]
        );

        if (endUserResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(500).json({ message: "Failed to create account" });
        }

        const encryptedPassword = encrypt(password);

        const accountResult = await client.query(
            `
              INSERT INTO eSparkTalentAPI_account_n_persmission 
              (account_name, email, password, image, 
               employee_perms, client_perms, leaves_perms, 
               invoices_perms, policies_perms, guides_perms)
              VALUES (
                $1, $2, $3, $4,
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false),
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false),
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false),
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false),
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false),
                jsonb_build_object('read', false, 'write', false, 'delete', false, 'download', false)
              )
              RETURNING *
            `,
            [account_name, email, encryptedPassword, imageS3Key]
        );


        if (accountResult.rows.length === 0) {
            await client.query("ROLLBACK");
            logger.error(`Failed to create account`);
            return res.status(500).json({ message: "Failed to create account" });
        }

        await client.query("COMMIT");

        let imageUrl = null;
        try {
            if (imageS3Key) {
                imageUrl = await getSignedUrl(imageS3Key);
            }
        } catch (uploadError) {
            logger.error(`S3 upload error: ${uploadError}`);
        }

        return res.status(200).json(
            {
                message: "Account created successfully",
                id: accountResult.rows[0].id,
                image: imageUrl
            }
        );


    } catch (error) {
        logger.error(`Error adding account: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
}

export default addAccount;