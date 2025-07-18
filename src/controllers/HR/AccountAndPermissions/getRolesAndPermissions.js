import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getRolesAndPermissions = async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT id, account_name AS role, 
             employee_perms, client_perms, leaves_perms,
             invoices_perms, policies_perms, guides_perms
      FROM eSparkTalentAPI_account_n_persmission
    `);

    const records = result.rows.map((row) => ({
      id: row.id,
      role: row.role,
      employee_perms: row.employee_perms,
      client_perms: row.client_perms,
      leaves_perms: row.leaves_perms,
      invoices_perms: row.invoices_perms,
      policies_perms: row.policies_perms,
      guides_perms: row.guides_perms,
    }));

    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error in getRolesAndPermissions:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getRolesAndPermissions;
