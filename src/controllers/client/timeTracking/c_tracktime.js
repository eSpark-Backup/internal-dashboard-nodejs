import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getClientTimeTracking = async (req, res) => {
  const { email: clientEmail } = req.user;
  const { year, month, emp_id: employeeEmail } = req.query;

  let client;

  try {
    
    client = await pool.connect();

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [clientEmail]
    );
    if (clientResult.rowCount === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    const clientId = clientResult.rows[0]?.id;

    const empResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
      [employeeEmail]
    );
    if (empResult.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeId = empResult.rows[0]?.id;

    let query = `
      SELECT record FROM eSparkTalentAPI_time_sheet
      WHERE employee_id = $1 AND client_id = $2
    `;
    const queryParams = [employeeId, clientId];

    if (year && month) {
      query += ` AND month = $3 AND year = $4`;
      queryParams.push(month, year);
    } else if (year) {
      query += ` AND year = $3`;
      queryParams.push(year);
    }

    const result = await client.query(query, queryParams);

    const timeSheet = [];

    for (const row of result.rows) {
      const record = row?.record || {};
      for (const date in record) {
        timeSheet.push({
          date,
          ...record[date],
        });
      }
    }

    return res.status(200).json({ time_sheet: timeSheet });
  } catch (err) {
    logger.error("Error in getClientTimeTracking:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getClientTimeTracking;