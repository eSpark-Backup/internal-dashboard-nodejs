import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getOffshoreContracts = async (req, res) => {
  try {
    
    const offshoreResult = await pool.query(`
      SELECT 
        oc.id,
        oc.contract_name,
        c.email AS client_email,
        e.email AS employee_email,
        c.client_id,
        e.employee_id,
        TO_CHAR(oc.date, 'YYYY-MM-DD') AS date
      FROM eSparkTalentAPI_offshore_contracts oc
      JOIN eSparkTalentAPI_client c ON oc.client_id = c.id
      JOIN eSparkTalentAPI_employee e ON oc.employee_id = e.id
    `);

    if (offshoreResult.rows.length === 0) {
      return res
        .status(204)
        .json({ message: "No offshore contracts available" });
    }

    return res.status(200).json(offshoreResult.rows);
  } catch (error) {
    logger.error("Error fetching offshore contracts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getOffshoreContracts;
