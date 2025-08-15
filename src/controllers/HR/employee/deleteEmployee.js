import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";

const deleteEmployee = async (req, res) => {
  const employeeId = req.query.id;

  let client;

  try {

    client = await pool.connect();

    await client.query("BEGIN");

    const empRes = await client.query(
      `SELECT email, first_name, last_name, image, resume FROM eSparkTalentAPI_employee WHERE id = $1`,
      [employeeId]
    );

    if (empRes.rows.length === 0) {
      logger.warn(`No employee found with ID: ${employeeId}`);
      return res.status(404).json({ message: "Employee not found" });
    }

    const { email, first_name, last_name, image, resume } = empRes.rows[0];
    const fullName = `${first_name} ${last_name}`;

    try {
      const endUserRes = await client.query(
        `DELETE FROM eSparkTalentAPI_end_user WHERE email = $1`,
        [email]
      );

      const letterRes = await client.query(
        `DELETE FROM eSparkTalentAPI_letter WHERE email = $1`,
        [email]
      );
      logger.info(
        `Deleted ${letterRes.rowCount} row(s) from eSparkTalentAPI_letter`
      );
    } catch (manualDeleteErr) {
      logger.error(`Manual delete failed: ${manualDeleteErr.message}`);
      await client.query("ROLLBACK");
      return res
        .status(500)
        .json({ message: "Error deleting related records" });
    }

    const filesToDelete = [];
    if (image) filesToDelete.push(image);
    if (resume) filesToDelete.push(resume);

    for (const key of filesToDelete) {
      const removed = await removeFromS3(key);
      if (!removed.success) {
        logger.error(
          `Failed to delete S3 file: ${key}, reason: ${removed.error}`
        );
        await client.query("ROLLBACK");
        return res
          .status(500)
          .json({ message: `Failed to delete file: ${key}` });
      }
      logger.info(`Deleted file from S3: ${key}`);
    }

    await client.query(`DELETE FROM eSparkTalentAPI_employee WHERE id = $1`, [
      employeeId,
    ]);


    await client.query("COMMIT");
    
    return res
      .status(200)
      .json({ message: `${fullName} is removed successfully` });

  } catch (error) {

    await client.query("ROLLBACK");
    logger.error(`delete employee error: ${error.stack || error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default deleteEmployee;
