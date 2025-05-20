import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import { getFormattedTimestamp } from "../../../helpers/utils.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import fs from "fs";
import path from "path";

const createLetter = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, objective, issue_date, reason } = req.body;
    const letterFile = req.files?.letter?.[0];

    const fileErrors =
      validateFile({
        file: letterFile,
        name: "letter",
        allowedTypes: ["application/pdf"],
        maxSizeMB: 5,
      }) || {};

    if (Object.keys(fileErrors).length > 0) {
      return res.status(400).json(fileErrors);
    }

    await client.query("BEGIN");

    const empCheck = await client.query(
      `SELECT 1 FROM eSparkTalentAPI_employee WHERE email = $1`,
      [email]
    );

    if (empCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ email: ["Employee does not exist"] });
    }

    const letter = letterFile.filename;

    let letterS3Key;
    try {
      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(letterFile.originalname);
      letterS3Key = `${S3_TEMP_BUCKET}/employees/letters/${timestamp}_${fileName}`;

      const fileContent = fs.readFileSync(letterFile.path);
      await uploadToS3(letterS3Key, fileContent, letterFile.mimetype);
      fs.unlinkSync(letterFile.path);
    } catch (uploadErr) {
      await client.query("ROLLBACK");
      logger.error(`S3 upload error: ${uploadErr}`);
      return res.status(500).json({ message: "File upload failed" });
    }

    const insertQuery = `
      INSERT INTO eSparkTalentAPI_letter (email, objective, issue_date, letter, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const { rows } = await client.query(insertQuery, [
      email,
      objective,
      issue_date,
      letter,
      reason || null,
    ]);

    await client.query("COMMIT");

    logger.info(`One new letter has been added`);
    return res.status(201).json({
      message: "One new letter has been added",
      id: rows[0].id,
    });
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.name === "ValidationError") {
      const errors = {};
      err.inner.forEach((e) => {
        errors[e.path] = e.errors;
      });
      return res.status(400).json(errors);
    }

    logger.error(`Letter creation error: ${err}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export default createLetter;
