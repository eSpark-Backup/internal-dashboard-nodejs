import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const getStartHire = async (req, res) => {
  const { id } = req.query;
  let client;

  try {
    client = await pool.connect();

    const clientResult = await client.query(
      `SELECT email FROM eSparkTalentAPI_client WHERE id = $1`,
      [id]
    );

    const clientEmail = clientResult.rows[0]?.email;
    if (!clientEmail) {
      return res.status(404).json({ message: "Client not found" });
    }

    const hiringReqResult = await client.query(
      `SELECT id, job_title, role_type, gender, employment_term, salary_range, 
          salary_currency, country, TO_CHAR(hiring_start_date, 'YYYY-MM-DD') AS hiring_start_date, TO_CHAR(hiring_end_date, 'YYYY-MM-DD') AS hiring_end_date, comments
   FROM eSparkTalentAPI_hiring_request 
   WHERE client_id = $1`,
      [id]
    );

    return res.status(200).json(hiringReqResult.rows);
  } catch (error) {
    logger.error("Error fetching hiring requests:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default getStartHire;
