import pool from "../../../config/db.js";

const getLettersByEmployeeEmail = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const email = req.query.email;

    const employeeRes = await client.query(
      `SELECT id FROM esparktalentapi_employee WHERE email = $1`,
      [email]
    );

    if (employeeRes?.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Employee with this email not found" });
    }

    const letterRes = await client.query(
      `SELECT id, objective, email, TO_CHAR(issue_date, 'YYYY-MM-DD') AS issue_date, reason
   FROM esparktalentapi_letter
   WHERE email = $1`,
      [email]
    );

    return res.status(200).json(letterRes.rows);
  } catch (err) {
    console.error(`Get letters error: ${err}`);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export default getLettersByEmployeeEmail;
