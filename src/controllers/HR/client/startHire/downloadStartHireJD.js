import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../../helpers/s3.js";

const downloadStartHireJD = async (req, res) => {
  const { id } = req.query;

  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT job_description, job_title FROM eSparkTalentAPI_hiring_request WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Hiring request not found with given ID" });
    }

    const { job_description, job_title } = result.rows[0];

    if (!job_description) {
      return res
        .status(204)
        .json({ message: "Job description file not found" });
    }

    const ext = job_description.split(".").pop();
    const fileName = `JobDescription_${job_title.replace(/\s+/g, "_")}.${ext}`;

    return downloadFileFromS3(
      res,
      job_description,
      fileName,
      "application/pdf"
    );
  } catch (error) {
    logger.error("Error downloading JD file:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default downloadStartHireJD;
