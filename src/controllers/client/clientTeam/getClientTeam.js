import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getClientTeam = async (req, res) => {
  const { email } = req.user;
  const { status } = req.query;
  let client;

  try {
    client = await pool.connect();

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
      [email]
    );

    const clientId = clientResult.rows[0]?.id;
    if (!clientId) {
      return res.status(404).json({ message: "Client not found" });
    }

    const records = [];

    if (status === "active" || status === "terminated") {
      const outsourceRes = await client.query(
        `SELECT oe.country, oe.job_title, oe.employment_term, 
                TO_CHAR(oe.joining_date, 'YYYY-MM-DD') AS joining_date,
                e.first_name, e.last_name
         FROM eSparkTalentAPI_outsource_employees oe
         JOIN eSparkTalentAPI_employee e ON oe.employee_id = e.id
         WHERE oe.client_id = $1 AND oe.status = $2`,
        [clientId, status]
      );

      outsourceRes.rows.forEach((row) => {
        records.push({
          employee_name: `${row.first_name} ${row.last_name}`,
          country: row.country,
          job_title: row.job_title,
          employment_term: row.employment_term,
          joining_date: row.joining_date,
        });
      });
    } else if (status === "onboard") {
      const onboardRes = await client.query(
        `SELECT employee_name, country, role_type, job_title, employment_term, 
                TO_CHAR(joining_date, 'YYYY-MM-DD') AS joining_date
         FROM eSparkTalentAPI_onboarding
         WHERE client_id = $1`,
        [clientId]
      );

      onboardRes.rows.forEach((row) => {
        records.push({
          employee_name: row.employee_name,
          country: row.country,
          role_type: row.role_type,
          job_title: row.job_title,
          employment_term: row.employment_term,
          joining_date: row.joining_date,
        });
      });
    } else {
      const [onboardRes, outsourceRes] = await Promise.all([
        client.query(
          `SELECT employee_name, country, role_type, job_title, employment_term, 
                  TO_CHAR(joining_date, 'YYYY-MM-DD') AS joining_date
           FROM eSparkTalentAPI_onboarding
           WHERE client_id = $1`,
          [clientId]
        ),
        client.query(
          `SELECT oe.country, oe.job_title, oe.employment_term, 
                  TO_CHAR(oe.joining_date, 'YYYY-MM-DD') AS joining_date,
                  e.first_name, e.last_name
           FROM eSparkTalentAPI_outsource_employees oe
           JOIN eSparkTalentAPI_employee e ON oe.employee_id = e.id
           WHERE oe.client_id = $1`,
          [clientId]
        ),
      ]);

      onboardRes.rows.forEach((row) => {
        records.push({
          employee_name: row.employee_name,
          country: row.country,
          role_type: row.role_type,
          job_title: row.job_title,
          employment_term: row.employment_term,
          joining_date: row.joining_date,
        });
      });

      outsourceRes.rows.forEach((row) => {
        records.push({
          employee_name: `${row.first_name} ${row.last_name}`,
          country: row.country,
          job_title: row.job_title,
          employment_term: row.employment_term,
          joining_date: row.joining_date,
        });
      });
    }

    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error in getClientTeam:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getClientTeam;
