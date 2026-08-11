import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const addAsset = async (req, res) => {

  const {
    assignee_email,
    gadget,
    asset_id,
    assigned_date,
    assignee_name,
    employee_id: employee_email,
  } = req.body || {};

  try {

    const employeeQuery = await pool.query(
      `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
      [employee_email]
    );

    if (employeeQuery.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "employee with this email not found" });
    }

    const numericEmployeeId = employeeQuery.rows[0].id;

    const insertQuery = `
      INSERT INTO eSparkTalentAPI_asset (
        assignee_email, gadget, asset_id, assigned_date,
        assignee_name, employee_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const insertValues = [
      assignee_email,
      gadget,
      asset_id,
      assigned_date,
      assignee_name,
      numericEmployeeId,
    ];

    const result = await pool.query(insertQuery, insertValues);

    if (!result.rows[0].id) {
      return res.status(400).json({ message: "Failed to add asset" });
    }

    logger.info("Asset added successfully", { id: result.rows[0].id });

    return res.status(201).json({
      message: "One new asset has been added",
      id: result.rows[0].id,
    });
  } catch (error) {
    logger.error("Error adding asset", { error });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default addAsset;
