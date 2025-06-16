import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getEmpOffshoreContracts = async (req, res) => {
  try {
    const employeeEmail = req.user?.email;
    const workspaceEmail = req.query.workspace;

    if (!employeeEmail || !workspaceEmail) {
      return res
        .status(400)
        .json({ message: "Missing employee email or workspace in request" });
    }

    const clientRes = await pool.query(
      `SELECT id, client_id FROM eSparkTalentAPI_client WHERE email = $1`,
      [workspaceEmail]
    );
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    const clientId = clientRes.rows[0].id;

    const employeeRes = await pool.query(
      `SELECT id, employee_id FROM eSparkTalentAPI_employee WHERE email = $1`,
      [employeeEmail]
    );
    if (employeeRes.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employeeId = employeeRes.rows[0].id;

    const offshoreQuery = `
  SELECT 
    oc.id,
    $1 AS client_email,
    c.client_id,
    $2 AS employee_email,
    e.employee_id,
    oc.contract_name,
    TO_CHAR(oc.date, 'YYYY-MM-DD') AS date
  FROM eSparkTalentAPI_offshore_contracts oc
  JOIN eSparkTalentAPI_client c ON oc.client_id = c.id
  JOIN eSparkTalentAPI_employee e ON oc.employee_id = e.id
  WHERE oc.client_id = $3 AND oc.employee_id = $4
`;
    const result = await pool.query(offshoreQuery, [
      workspaceEmail,
      employeeEmail,
      clientId,
      employeeId,
    ]);

    return res.status(200).json(result.rows);
  } catch (error) {
    logger.error("Error fetching offshore contracts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getEmpOffshoreContracts;
