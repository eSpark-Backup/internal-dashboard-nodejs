import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getClientEmployeeContracts = async (req, res) => {
  const { email } = req.user;

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

    const contractResult = await client.query(
      `SELECT id, contract_name, employee_id, TO_CHAR(date, 'YYYY-MM-DD') as date
       FROM eSparkTalentAPI_offshore_contracts
       WHERE client_id = $1`,
      [clientId]
    );

    const contracts = contractResult.rows;

    const records = [];

    for (const contract of contracts) {
      try {
        const empResult = await client.query(
          `SELECT employee_id, email FROM eSparkTalentAPI_employee WHERE id = $1`,
          [contract.employee_id]
        );

        if (empResult.rows.length) {
          const emp = empResult.rows[0];

          records.push({
            id: contract.id,
            contract_name: contract.contract_name,
            employee_email: emp.email,
            employee_id: emp.employee_id,
            date: contract.date,
          });
        }
      } catch (err) {
        logger.warn(
          `Failed to get employee for contract_id=${contract.id}: ${err.message}`
        );
        continue;
      }
    }

    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error in getClientEmployeeContracts:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getClientEmployeeContracts;
