import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const updateAsset = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.query;
    const updates = req.body || {};

    logger.info("Update asset request received", { assetId: id, updates });

    const result = await client.query(
      `SELECT * FROM esparktalentapi_asset WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      logger.warn(`Asset record not found for update: id=${id}`);
      return res.status(404).json({ message: "Asset record not found" });
    }

    if (updates?.employee_id) {
      logger.info("Resolving employee email to id", {
        email: updates?.employee_id,
      });
      const empRes = await client.query(
        `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
        [updates?.employee_id]
      );
      if (empRes.rowCount === 0) {
        logger.warn(`Invalid employee email provided: ${updates?.employee_id}`);
        return res.status(404).json({ message: "Employee not found" });
      }
      updates.employee_id = empRes.rows[0].id;
      logger.info("Employee email resolved to id", {
        employeeId: updates.employee_id,
      });
    }

    const {
      asset_id,
      employee_id,
      gadget,
      assigned_date,
      assignee_name,
      assignee_email,
    } = updates || {};

    const updateQuery = `
  UPDATE esparktalentapi_asset
  SET
    asset_id = COALESCE($1, asset_id),
    employee_id = COALESCE($2, employee_id),
    gadget = COALESCE($3, gadget),
    assigned_date = COALESCE($4, assigned_date),
    assignee_name = COALESCE($5, assignee_name),
    assignee_email = COALESCE($6, assignee_email)
  WHERE id = $7
`;

    const values = [
      asset_id ?? null,
      employee_id ?? null,
      gadget ?? null,
      assigned_date ?? null,
      assignee_name ?? null,
      assignee_email ?? null,
      id,
    ];

    await client.query(updateQuery, values);

    logger.info(`Asset record updated successfully`, { assetId: id, updates });

    return res
      .status(200)
      .json({ message: "Asset record has been updated successfully" });
  } catch (err) {
    logger.error("Update asset error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default updateAsset;
