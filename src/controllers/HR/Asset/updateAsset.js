import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const updateAsset = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.query;
    const updates = req.body;

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

    const fields = [];
    const values = [];
    let paramIdx = 1;

    const allowedFields = [
      "asset_id",
      "employee_id",
      "gadget",
      "assigned_date",
      "assignee_name",
      "assignee_email",
    ];

    for (const key in updates) {
      if (!allowedFields.includes(key)) {
        logger.warn(`Unrecognized update field: ${key}`);
        return res
          .status(400)
          .json({ message: `Field ${key} is not allowed for update` });
      }
      fields.push(`${key} = $${paramIdx++}`);
      values.push(updates[key]);
    }
    if (fields.length === 0) {
      logger.warn("No fields provided for update");
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);
    const updateQuery = `
      UPDATE esparktalentapi_asset
      SET ${fields.join(", ")}
      WHERE id = $${paramIdx}
    `;

    await client.query(updateQuery, values);

    logger.info(`Asset record updated successfully`, { assetId: id, updates });

    return res
      .status(200)
      .json({ message: "Asset record has been updated successfully" });
  } catch (err) {
    logger.error("Update asset error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    client.release();
  }
};

export default updateAsset;
