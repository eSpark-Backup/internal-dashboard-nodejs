import pool from "../../../config/db.js";
import { removeFromS3 } from "../../../helpers/s3.js";
import { logger } from "../../../helpers/logger.js";

const deleteLeaveRequest = async (req, res) => {
  const requestId = req.query.id;

  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, attachment FROM eSparkTalentAPI_leave_request WHERE id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const { attachment } = result.rows[0];

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM eSparkTalentAPI_notifications 
       WHERE ref_id = $1 AND notification_type = 'leave_request'`,
      [requestId]
    );

    if (attachment) {
      const removed = await removeFromS3(attachment);
      if (!removed.success) {
        logger.error(
          `Failed to delete S3 file: ${attachment}, reason: ${removed.error}`
        );
        await client.query("ROLLBACK");
        return res
          .status(500)
          .json({ message: `Failed to delete file: ${attachment}` });
      }
      logger.info(`Deleted file from S3: ${attachment}`);
    }

    await client.query(
      `DELETE FROM eSparkTalentAPI_leave_request WHERE id = $1`,
      [requestId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Leave request is successfully deleted",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Delete leave request error:", err);
    return res.status(400).json({ message: "Something went wrong" });
  } finally {
    client?.release();
  }
};

export default deleteLeaveRequest;
