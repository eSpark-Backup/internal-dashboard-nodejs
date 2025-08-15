import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";

const hrClientAddEmp = async (req, res) => {
  const { c_email } = req.query;
  const {
    id,
    country,
    job_title,
    role_type,
    employment_term,
    joining_date,
    salary,
  } = req.body;

  let client;

  try {

    client = await pool.connect();

    const empResult = await client.query(
      `SELECT id, email, first_name, last_name FROM eSparkTalentAPI_employee WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!empResult.rows.length) {
      return res.status(404).json({ message: "Employee does not exist" });
    }

    const emp = empResult.rows[0];

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
      [c_email]
    );

    if (!clientResult.rows.length) {
      return res.status(404).json({ message: "Client does not exist" });
    }

    const clientId = clientResult.rows[0].id;

    const insertOutsource = await client.query(
      `INSERT INTO eSparkTalentAPI_outsource_employees 
        (client_id, employee_id, job_title, country, role_type, employment_term, joining_date, salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        clientId,
        emp.id,
        job_title,
        country,
        role_type,
        employment_term,
        joining_date,
        salary,
      ]
    );

    const outEmpId = insertOutsource.rows[0]?.id;

    if (!outEmpId) {
      return res
        .status(400)
        .json({ message: "Failed to add outsource employee" });
    }

    await client.query(
      `INSERT INTO eSparkTalentAPI_notifications 
        (email, ref_id, notification_type, status, description)
       VALUES ($1, $2, 'team_member', 'added', $3)`,
      [
        c_email,
        outEmpId,
        `${emp.first_name} ${emp.last_name} have been added to your team`,
      ]
    );

    return res.status(201).json({
      message: `${emp.first_name} ${emp.last_name} is added successfully`,
      id: outEmpId,
    });
    
  } catch (err) {
    logger.error("Error in hrClientAddEmp:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default hrClientAddEmp;
