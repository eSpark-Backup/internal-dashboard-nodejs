import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateTimeAndLeave = async (req, res) => {
  const { id, tab } = req.query;

  try {
    if (tab === "time") {
      const { check_in, check_out } = req.body || {};

      const obj = {};
      if (check_in) obj.check_in = check_in;
      if (check_out) obj.check_out = check_out;

      if (Object.keys(obj).length === 0) {
        return res
          .status(400)
          .json({ message: "No timing fields provided to update" });
      }

      const query = `
        UPDATE eSparkTalentAPI_employee
        SET punch_timings = COALESCE(punch_timings, '{}'::jsonb) || $1::jsonb
        WHERE id = $2
      `;
      const values = [JSON.stringify(obj), id];

      const { rowCount } = await pool.query(query, values);

      if (rowCount === 0) {
        return res.status(404).json({ message: "Employee record not found" });
      }

      return res.status(200).json({ message: "Timings updated successfully" });
    } else if (tab === "leaves") {
      const casual_leaves = req.body.casual_leaves
        ? JSON.stringify(req.body.casual_leaves)
        : null;
      const sick_leaves = req.body.sick_leaves
        ? JSON.stringify(req.body.sick_leaves)
        : null;
      const annual_leaves = req.body.annual_leaves
        ? JSON.stringify(req.body.annual_leaves)
        : null;
      const unpaid_leaves = req.body.unpaid_leaves
        ? JSON.stringify(req.body.unpaid_leaves)
        : null;
      const paid_leaves = req.body.paid_leaves
        ? JSON.stringify(req.body.paid_leaves)
        : null;
      const hajj_leaves = req.body.hajj_leaves
        ? JSON.stringify(req.body.hajj_leaves)
        : null;

      const values = [
        casual_leaves,
        sick_leaves,
        annual_leaves,
        unpaid_leaves,
        paid_leaves,
        hajj_leaves,
        id,
      ];

      const updateQuery = `
    UPDATE eSparkTalentAPI_leave_balance
    SET
      casual_leaves = COALESCE($1::jsonb, casual_leaves),
      sick_leaves = COALESCE($2::jsonb, sick_leaves),
      annual_leaves = COALESCE($3::jsonb, annual_leaves),
      unpaid_leaves = COALESCE($4::jsonb, unpaid_leaves),
      paid_leaves = COALESCE($5::jsonb, paid_leaves),
      hajj_leaves = COALESCE($6::jsonb, hajj_leaves)
    WHERE employee_id = $7
  `;

      const { rowCount } = await pool.query(updateQuery, values);

      if (rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Leave balance record not found" });
      }

      logger.info(`Updated leave balances for employee ID ${id}`);
      return res.status(200).json({ message: "Leaves updated successfully" });
    }

    return res.status(400).json({ message: "Invalid tab value" });
  } catch (err) {
    logger.error(`PATCH /hr_emp_t&l failed: ${err.message}`);
    return res.status(400).json({ message: "Invalid tab value" });
  }
};

export default updateTimeAndLeave;
