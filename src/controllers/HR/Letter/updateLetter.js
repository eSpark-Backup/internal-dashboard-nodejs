import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";

const updateLetter = async (req, res) => {
  let client;
  const { reason } = req.body || {};
  const letterFile = req.file;

  try {
    client = await pool.connect();

    const id = req.query.id;

    await client.query("BEGIN");
    const letterRes = await client.query(
      `SELECT * FROM esparktalentapi_letter WHERE id = $1`,
      [id]
    );

    if (letterRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Letter not found" });
    }

    let updatedLetterPath = null;
    
    try {
      if (letterFile) {
        const fileErrors =
          validateFile({
          file: letterFile,
          name: "letter",
          allowedTypes: ["application/pdf"],
          maxSizeMB: 5,
        }) || {};

      if (Object.keys(fileErrors).length > 0) {
        await client.query("ROLLBACK");
        await cleanupFiles([{ localPath: letterFile?.path }]);
        return res.status(400).json(fileErrors);
      }

      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(letterFile.originalname);
      const s3Key = `${S3_TEMP_BUCKET}/employees/letters/${timestamp}_${fileName}`;
      const fileContent = fs.readFileSync(letterFile.path);

      await uploadToS3(s3Key, fileContent, letterFile.mimetype);
      await cleanupFiles([{ localPath: letterFile?.path }]);

        updatedLetterPath = s3Key;
      }
    } catch (error) {
      logger.error(`Error uploading letter: ${error.message}`);
      await cleanupFiles([{ localPath: letterFile?.path }]);
      return res.status(500).json({ message: "Internal server error" });
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (reason) {
      fieldsToUpdate.push(`reason = $${paramIndex++}`);
      values.push(reason);
    }

    if (updatedLetterPath) {
      fieldsToUpdate.push(`letter = $${paramIndex++}`);
      values.push(updatedLetterPath);
    }

    if (fieldsToUpdate.length === 0) {
      await client.query("ROLLBACK");
      await cleanupFiles([{ localPath: letterFile?.path }]);
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const updateQuery = `
      UPDATE esparktalentapi_letter
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${paramIndex}
    `;

    await client.query(updateQuery, values);
    await client.query("COMMIT");

    return res.status(200).json({ message: "Letter updated successfully" });
  } 
  catch (err) {
    await client.query("ROLLBACK");
    logger.error(`Letter update error: ${err}`);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default updateLetter;
