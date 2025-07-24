import pool from "../../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../../helpers/s3.js";
import {
  cleanupFiles,
  getFormattedTimestamp,
} from "../../../../helpers/utils.js";
import { validateFile } from "../../../../utils/validateFiles.js";

const addStartHire = async (req, res) => {
  const {
    client_id,
    job_title,
    role_type,
    gender,
    employment_term,
    salary_range,
    salary_currency,
    country,
    hiring_start_date,
    hiring_end_date,
    comments,
  } = req.body;

  const job_description = req.file;
  console.log("job_description", job_description);
  let client;
  try {
    client = await pool.connect();

    const clientResult = await client.query(
      `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`,
      [client_id]
    );

    if (!clientResult.rows.length) {
      return res
        .status(404)
        .json({ message: "Client does not exist with given client email" });
    }

    await client.query("BEGIN");
    // ✅ Validate uploaded file
    const fileErrors = {};
    const jobDescValidationErrors = validateFile({
      file: job_description,
      name: "job_description",
      required: true,
      allowedTypes: ["application/pdf"],
      maxSizeMB: 5,
    });
    Object.assign(fileErrors, jobDescValidationErrors || {});
    if (Object.keys(fileErrors).length > 0) {
      await cleanupFiles([{ localPath: job_description?.path }]);
      return res.status(400).json({
        message: "Invalid file",
        errors: fileErrors,
      });
    }

    const timestamp = getFormattedTimestamp();
    const fileName = path.basename(job_description.originalname);
    const s3Key = `${S3_TEMP_BUCKET}/hiring/descriptions/${timestamp}_${fileName}`;

    const fileContent = fs.readFileSync(job_description.path);
    await uploadToS3(s3Key, fileContent, job_description.mimetype);
    await cleanupFiles([{ localPath: job_description.path }]);
    const parsedRange =
      typeof salary_range === "string"
        ? JSON.parse(salary_range)
        : salary_range;

    const parsedSalaryRange = {
      minimum: String(parsedRange.minimum),
      maximum: String(parsedRange.maximum),
    };

    const hiringReq = await client.query(
      `INSERT INTO eSparkTalentAPI_hiring_request 
  (client_id, job_title, role_type, gender, employment_term, salary_range, salary_currency, country, hiring_start_date, hiring_end_date, job_description, comments) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
  RETURNING id`,
      [
        clientResult.rows[0].id,
        job_title,
        role_type,
        gender,
        employment_term,
        JSON.stringify(parsedSalaryRange),
        salary_currency,
        country,
        hiring_start_date,
        hiring_end_date,
        s3Key,
        comments || null,
      ]
    );

    if (!hiringReq.rows[0]?.id) {
      await client.query("ROLLBACK");
      await cleanupFiles([{ localPath: job_description?.path, s3Key: s3Key }]);
      return res
        .status(400)
        .json({ message: "Failed to create hiring request" });
    }

    const notification = await client.query(
      `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        clientResult.rows[0].email,
        hiringReq.rows[0].id,
        "hiring_request",
        "A new hiring request created.",
        "added",
      ]
    );

    if (!notification.rows[0]?.id) {
      await client.query("ROLLBACK");
      await cleanupFiles([{ localPath: job_description?.path, s3Key: s3Key }]);
      return res.status(400).json({ message: "Failed to add notification" });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "One new request is successfully added to hiring",
      id: hiringReq.rows[0].id,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    logger.error("Error creating hiring request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default addStartHire;
