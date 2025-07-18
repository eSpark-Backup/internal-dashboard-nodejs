import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getClientPunchRequests = async (req, res) => {
  const { email } = req.user;
  const { status } = req.query;

  let client;

  try {
    client = await pool.connect();

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [email]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const clientId = clientResult.rows[0].id;

    let queryText = `
      SELECT 
        pr.id,
        pr.employee_id,
        TO_CHAR(pr.date, 'YYYY-MM-DD') as date,
        pr.punch_time,
        pr.punch_type,
        pr.description,
        pr.status,
        e.first_name,
        e.last_name
      FROM eSparkTalentAPI_punch_request pr
      JOIN eSparkTalentAPI_employee e ON e.id = pr.employee_id
      WHERE pr.client_id = $1
    `;

    const queryParams = [clientId];

    if (["pending", "completed", "rejected"].includes(status)) {
      queryText += ` AND pr.status = $2`;
      queryParams.push(status);
    }

    const punchResult = await client.query(queryText, queryParams);

    const records = punchResult.rows.map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: `${row.first_name} ${row.last_name}`,
      date: row.date,
      punch_time: row.punch_time,
      punch_type: row.punch_type,
      description: row.description,
      status: row.status,
    }));

    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error fetching clock in/out requests:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getClientPunchRequests;
