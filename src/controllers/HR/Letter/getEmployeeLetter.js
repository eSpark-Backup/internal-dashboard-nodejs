import pool from "../../../config/db.js";

export const getLettersByEmployeeEmail = async (req, res) => {
  const client = await pool.connect();
  try {
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
      `SELECT id, objective, email, issue_date, reason
       FROM esparktalentapi_letter
       WHERE email = $1`,
      [email]
    );

    return res.status(200).json(letterRes.rows);
  } catch (err) {
    console.error("Get letters error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
