import pool from "../../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../../helpers/logger.js";
import {
  uploadToS3,
  removeFromS3,
  S3_TEMP_BUCKET,
} from "../../../../helpers/s3.js";
import {
  cleanupFiles,
  getFormattedTimestamp,
} from "../../../../helpers/utils.js";
import { validateFile } from "../../../../utils/validateFiles.js";

const updateStartHire = async (req, res) => {
  const { id } = req.query;
  const {
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
  } = req.body || {};

  const job_description = req.file;

  const isEmptyBody =
    !job_description &&
    (!req.body ||
      !Object.values(req.body).some(
        (v) => v !== undefined && v !== null && v !== ""
      ));

  if (isEmptyBody) {
    return res
      .status(400)
      .json({ message: "At least one field must be provided to update" });
  }

  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT * FROM eSparkTalentAPI_hiring_request WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Hiring request not found" });
    }

    const oldRecord = result.rows[0];
    let updatedJobDescPath = oldRecord.job_description;

    if (job_description) {
      const fileErrors = validateFile({
        file: job_description,
        name: "job_description",
        required: false,
        allowedTypes: ["application/pdf"],
        maxSizeMB: 5,
      });

      if (fileErrors) {
        await cleanupFiles([{ localPath: job_description?.path }]);
        return res
          .status(400)
          .json({ message: "Invalid file", errors: fileErrors });
      }

      // Delete old from S3
      const removed = await removeFromS3(oldRecord.job_description);
      if (removed?.error) {
        await cleanupFiles([{ localPath: job_description?.path }]);
        return res.status(400).json({ message: removed.error });
      }

      // Upload new
      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(job_description.originalname);
      updatedJobDescPath = `${S3_TEMP_BUCKET}/hiring/descriptions/${timestamp}_${fileName}`;
      const fileContent = fs.readFileSync(job_description.path);
      await uploadToS3(
        updatedJobDescPath,
        fileContent,
        job_description.mimetype
      );
      await cleanupFiles([{ localPath: job_description?.path }]);
    }

    let parsedSalaryRange = null;
    if (salary_range) {
      const rawRange =
        typeof salary_range === "string"
          ? JSON.parse(salary_range)
          : salary_range;

      parsedSalaryRange = {
        minimum: String(rawRange.minimum),
        maximum: String(rawRange.maximum),
      };
    }

    await client.query(
      `UPDATE eSparkTalentAPI_hiring_request SET
        job_title         = COALESCE($2, job_title),
        role_type         = COALESCE($3, role_type),
        gender            = COALESCE($4, gender),
        employment_term   = COALESCE($5, employment_term),
        salary_range      = COALESCE($6, salary_range),
        salary_currency   = COALESCE($7, salary_currency),
        country           = COALESCE($8, country),
        hiring_start_date = COALESCE($9, hiring_start_date),
        hiring_end_date   = COALESCE($10, hiring_end_date),
        comments          = COALESCE($11, comments),
        job_description   = $12,
        updated_at        = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [
        id,
        job_title ?? null,
        role_type ?? null,
        gender ?? null,
        employment_term ?? null,
        parsedSalaryRange ? JSON.stringify(parsedSalaryRange) : null,
        salary_currency ?? null,
        country ?? null,
        hiring_start_date ?? null,
        hiring_end_date ?? null,
        comments ?? null,
        updatedJobDescPath,
      ]
    );

    return res
      .status(200)
      .json({ message: "Hiring request has been updated successfully" });
  } catch (error) {
    logger.error("Error updating hiring request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default updateStartHire;
