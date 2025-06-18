import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const addWFHRequest = async (req, res) => {
  const { username, email } = req.user;
  const { start_date, end_date, reason, count } = req.body || {};
  const talentEmail = process.env.TALENT_EMAIL;

  let client;
  try {
    client = await pool.connect();
    client.query("BEGIN");

    const employee = await client.query(
      `SELECT id, email FROM eSparkTalentAPI_employee WHERE email = $1`,
      [email]
    );

    if (!employee.rows[0]) {
      logger.error(`Employee with email ${email} not found`);
      return res.status(404).json({ message: "Employee not found" });
    }


    const WfhRequest = await client.query(
      `INSERT INTO eSparkTalentAPI_wfh_request 
            (employee_id ,start_date, end_date, count, reason, status) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee.rows[0].id, start_date, end_date, count, reason, "pending"]
    );

    if (!WfhRequest.rows[0]) {
      await client.query("ROLLBACK");
      logger.error("Failed to add WFH request");
      return res.status(400).json({ message: "Failed to add WFH request" });
    }
    const clientResult = await client.query(
      `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`,
      [talentEmail]
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Client not found",
      });
    }

    const notification = await client.query(
      `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        clientResult.rows[0].email,
        WfhRequest.rows[0].id,
        "wfh_request",
        `${username} WFH request is pending`,
        "added",
      ]
    );

    if (!notification.rows[0]?.id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Failed to add notification" });
    }

    await client.query("COMMIT");
    

    logger.info(`WFH request added successfully for ${username}`);
    return res.status(200).json({
      message: "WFH request added successfully",
      id: WfhRequest.rows[0].id,
    });
  } catch (error) {
    logger.error(`Error adding WFH request: ${error.message}`);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default addWFHRequest;
