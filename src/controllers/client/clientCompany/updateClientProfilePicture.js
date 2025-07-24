import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { getFormattedTimestamp } from "../../../helpers/utils.js";
import {
  validateFile,
} from "../../../utils/validateFiles.js";
import {
  S3_TEMP_BUCKET,
  uploadToS3,
  removeFromS3,
  getSignedUrl,
} from "../../../helpers/s3.js";

const updateClientProfilePicture = async (req, res) => {
  const { email } = req.user;
  const imageFile = req.files?.picture?.[0];

  let client;
  try {
    const fileErrors = {};
    const validationErrors = validateFile({
      file: imageFile,
      name: "picture",
      allowedTypes: ["image/jpeg", "image/png", "image/jpg", "image/svg"],
      maxSizeMB: 5,
    });

    Object.assign(fileErrors, validationErrors || {});
    if (Object.keys(fileErrors).length > 0) {
      return res.status(400).json(fileErrors);
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const clientResult = await client.query(
      `SELECT image FROM eSparkTalentAPI_client WHERE email = $1`,
      [email]
    );

    if (!clientResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const oldImageKey = clientResult.rows[0].image;
    const timestamp = getFormattedTimestamp();
    const fileName = path.basename(imageFile.originalname);
    const s3ImageKey = `${S3_TEMP_BUCKET}/clients/profiles/${timestamp}_${fileName}`;
    const fileContent = fs.readFileSync(imageFile.path);

    await uploadToS3(s3ImageKey, fileContent, imageFile.mimetype);
    fs.unlinkSync(imageFile.path);

    if (oldImageKey) {
      try {
        await removeFromS3(oldImageKey);
      } catch (err) {
        logger.warn(`Failed to remove old image: ${err.message}`);
      }
    }

    await client.query(
      `UPDATE eSparkTalentAPI_client SET image = $1 WHERE email = $2`,
      [s3ImageKey, email]
    );

    await client.query("COMMIT");

    let signedUrl = null;
    try {
      signedUrl = await getSignedUrl(s3ImageKey);
    } catch (err) {
      logger.warn(`Failed to generate signed URL: ${err.message}`);
    }

    return res.status(201).json({
      message: "Profile picture is successfully updated",
      image: signedUrl,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    logger.error(`Error updating client profile picture: ${err}`);
    return res.status(400).json({ message: err.message });
  } finally {
    if (client) client.release();
  }
};

export default updateClientProfilePicture;
