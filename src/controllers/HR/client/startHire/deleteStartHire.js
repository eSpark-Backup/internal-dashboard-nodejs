import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";
import { removeFromS3 } from "../../../../helpers/s3.js";

const deleteStartHire = async (req, res) => {
  const { id } = req.query;

  let client;
  try {
    client = await pool.connect();

    const hiringReq = await client.query(
      `SELECT id, job_description FROM eSparkTalentAPI_hiring_request WHERE id = $1`,
      [id]
    );

    if (hiringReq.rowCount === 0) {
      return res.status(404).json({
        message: "Hiring request does not exist with given ID",
      });
    }

    const jobDescriptionPath = hiringReq.rows[0].job_description;

    await client.query("BEGIN");

    // 1. Delete file from S3
    if (jobDescriptionPath) {
      const removed = await removeFromS3(jobDescriptionPath);
      if (removed?.error) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Failed to delete S3 file", error: removed.error });
      }
    }

    // 2. Delete associated notifications
    await client.query(
      `DELETE FROM eSparkTalentAPI_notifications 
       WHERE ref_id = $1 AND notification_type = 'hiring_request'`,
      [id]
    );

    // 3. Delete hiring request
    await client.query(
      `DELETE FROM eSparkTalentAPI_hiring_request WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Hiring request is successfully deleted" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    logger.error(`Error deleting hiring request: ${error}`);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default deleteStartHire;
