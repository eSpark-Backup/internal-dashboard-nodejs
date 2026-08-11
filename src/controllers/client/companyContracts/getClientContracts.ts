import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getClientContracts = async (req, res) => {
  const { email } = req.user;

  try {
    const clientResult = await pool.query(
      `SELECT id, client_id FROM eSparkTalentAPI_client WHERE email = $1`,
      [email]
    );

    if (clientResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Client not found" });
    }

    const { id: clientId, client_id: clientUniqueId } = clientResult.rows[0];

    const contractResult = await pool.query(
      `SELECT 
         id, 
         contract_name, 
         TO_CHAR(date, 'YYYY-MM-DD') AS date 
       FROM eSparkTalentAPI_client_contract 
       WHERE client_id = $1`,
      [clientId]
    );

    const contracts = contractResult.rows.map((row) => ({
      id: row.id,
      contract_name: row.contract_name,
      client_id: clientUniqueId,
      email,
      date: row.date,
    }));

    return res.status(200).json(contracts);
  } catch (error) {
    logger.error(`Error fetching client contracts: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getClientContracts;
