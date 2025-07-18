import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const patchRolesAndPermissions = async (req, res) => {
  const { id } = req.query;
  const {
    employee_perms,
    client_perms,
    leaves_perms,
    invoices_perms,
    policies_perms,
    guides_perms,
  } = req.body;

  let client;
  try {
    client = await pool.connect();

    const existing = await client.query(
      `SELECT id FROM eSparkTalentAPI_account_n_persmission WHERE id = $1`,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    await client.query(
      `
    UPDATE eSparkTalentAPI_account_n_persmission SET
  employee_perms  = COALESCE(employee_perms, '{}'::jsonb) || COALESCE($2::jsonb, '{}'::jsonb),
  client_perms    = COALESCE(client_perms, '{}'::jsonb)   || COALESCE($3::jsonb, '{}'::jsonb),
  leaves_perms    = COALESCE(leaves_perms, '{}'::jsonb)   || COALESCE($4::jsonb, '{}'::jsonb),
  invoices_perms  = COALESCE(invoices_perms, '{}'::jsonb) || COALESCE($5::jsonb, '{}'::jsonb),
  policies_perms  = COALESCE(policies_perms, '{}'::jsonb) || COALESCE($6::jsonb, '{}'::jsonb),
  guides_perms    = COALESCE(guides_perms, '{}'::jsonb)   || COALESCE($7::jsonb, '{}'::jsonb)
WHERE id = $1;
    `,
      [
        id,
        employee_perms ?? null,
        client_perms ?? null,
        leaves_perms ?? null,
        invoices_perms ?? null,
        policies_perms ?? null,
        guides_perms ?? null,
      ]
    );

    return res
      .status(200)
      .json({ message: "Changes have been saved successfully" });
  } catch (err) {
    logger.error("Error in patchRolesAndPermissions:", err);
    return res.status(400).json({ message: err.message });
  } finally {
    if (client) client.release();
  }
};

export default patchRolesAndPermissions;
