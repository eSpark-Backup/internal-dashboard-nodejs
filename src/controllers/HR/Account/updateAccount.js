import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import { encrypt } from "../../../helpers/utils.js";


const updateAccount = async (req, res) => {
    const { id } = req.query;
    const { account_name, password } = req.body;
    const imageFile = req.files?.image?.[0];

    let client;

    try {

        client = await pool.connect();

        await client.query("BEGIN");

        const { rows: userRows } = await client.query(
            "SELECT email, image FROM eSparkTalentAPI_account_n_persmission WHERE id = $1",
            [id]
        );

        if (userRows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Account not found with this id" });
        }

        let imageUrl = userRows[0].image;

        if (imageFile) {
            const fileErrors = {};
            const imageValidationErrors = validateFile({
                file: imageFile,
                name: "image",
                required: true,
                allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
                maxSizeMB: 5,
            });

            Object.assign(fileErrors, imageValidationErrors || {});

            if (Object.keys(fileErrors).length > 0) {
                return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = path.basename(imageFile.originalname);
            const s3ImageKey = `${S3_TEMP_BUCKET}/accounts/profiles/${timestamp}_${fileName}`;

            const fileContent = fs.readFileSync(imageFile.path);
            await uploadToS3(s3ImageKey, fileContent, imageFile.mimetype);
            fs.unlinkSync(imageFile.path);

            imageUrl = s3ImageKey;
        }

        let hashedPassword = userRows[0].password;
        if (password) {
            hashedPassword = encrypt(password);
        }

        // update the account in the account_n_persmission table
        const updatedAccount = await pool.query(
            `UPDATE eSparkTalentAPI_account_n_persmission
                    SET account_name  = COALESCE($2, account_name),
                        password      = COALESCE($3, password),
                        image         = COALESCE($4, image),
                        updated_at    = CURRENT_TIMESTAMP
                WHERE id = $1`,
            [id, account_name, hashedPassword, imageUrl]
        );

        if (updatedAccount.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to update account" });
        }

        // update the password in the end_user table
        if (password) {
            const bcryptPassword = await bcrypt.hash(password, 10);
            const updatedPassword = await pool.query(
                `UPDATE eSparkTalentAPI_end_user
                    SET password = $1
                    WHERE email = $2`,
                [bcryptPassword, userRows[0].email]
            );

            if (updatedPassword.rowCount === 0) {
                await client.query("ROLLBACK");
                logger.error(`Failed to update password: ${updatedPassword.error}`);
                return res.status(400).json({ message: "Failed to update password" });
            }
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Account updated successfully" });

    }
    catch (err) {
        await client.query("ROLLBACK");
        logger.error(`Account update error: ${err}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    finally {
        client.release();
    }
}

export default updateAccount;
