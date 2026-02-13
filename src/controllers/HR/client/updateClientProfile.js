import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import {
  removeFromS3,
  S3_TEMP_BUCKET,
  uploadToS3,
  getSignedUrl,
} from "../../../helpers/s3.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";

const updateClientProfile = async (req, res) => {
  const { id } = req.query;
  const updates = req.body || {};
  const image = req.file;

  let client;
  let imageS3Key;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM eSparkTalentAPI_client WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const clientRecord = result.rows[0];
    imageS3Key = clientRecord.image;

    if (updates.email) {
      return res.status(400).json({ message: "Email field cannot be edited" });
    }

    try {
      if (image) {
        const fileErrors = validateFile({
          file: image,
          name: "image",
          required: false,
          allowedTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
          ],
          maxSizeMB: 5,
        });

        if (fileErrors) {
          await cleanupFiles([{ localPath: image?.path }]);
          return res.status(400).json(fileErrors);
        }

        if (clientRecord.image) {
          const removed = await removeFromS3(clientRecord.image);
          if (removed?.error) {
            await cleanupFiles([{ localPath: image?.path }]);
            return res.status(400).json({ message: removed.error });
          }
        }

        const timestamp = getFormattedTimestamp();
        const fileName = path.basename(image.originalname);
        imageS3Key = `${S3_TEMP_BUCKET}/clients/profile/${timestamp}_${fileName}`;

        const fileContent = fs.readFileSync(image.path);
        await uploadToS3(imageS3Key, fileContent, image.mimetype);
        await cleanupFiles([{ localPath: image?.path }]);
      }
    } catch (uploadError) {
      await client.query("ROLLBACK");
      await cleanupFiles([{ localPath: image?.path }]);
      logger.error(`S3 upload error: ${uploadError}`);
      return res.status(500).json({ message: "Failed to upload image" });
    }

    updates.image = imageS3Key;

    if (updates.company_name) {
      await client.query(
        `UPDATE eSparkTalentAPI_end_user SET username = $1 WHERE email = $2`,
        [updates.company_name, clientRecord.email],
      );
    }

    const {
      first_name,
      last_name,
      company_name,
      phone_number,
      join_date,
      country,
      address,
      image: imageField,
      invoice_due_date,
      preferred_payment_method,
    } = updates;

    await client.query(
      `
  UPDATE eSparkTalentAPI_client SET
    first_name    = COALESCE($2, first_name),
    last_name     = COALESCE($3, last_name),
    company_name  = COALESCE($4, company_name),
    phone_number  = COALESCE($5, phone_number),
    join_date     = COALESCE($6, join_date),
    country       = COALESCE($7, country),
    address       = COALESCE($8, address),
    image         = COALESCE($9, image),
    invoice_due_date = COALESCE($10, invoice_due_date),
    preferred_payment_method = COALESCE($11, preferred_payment_method)
  WHERE id = $1
  `,
      [
        id,
        first_name ?? null,
        last_name ?? null,
        company_name ?? null,
        phone_number ?? null,
        join_date ?? null,
        country ?? null,
        address ?? null,
        imageField ?? null,
        invoice_due_date ?? null,
        preferred_payment_method ?? null,
      ],
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

    return res.status(200).json({
      message: "Information updated successfully",
      image: imageUrl,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    logger.error("Update client profile failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default updateClientProfile;
