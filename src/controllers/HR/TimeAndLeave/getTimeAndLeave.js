import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";

const getTimeAndLeave = async (req, res) => {
  const { id, tab } = req.query;
  logger.info(`GET /hr_emp_t&l called with id=${id}, tab=${tab}`);

  if (tab === "time") {
    try {
      const { rows } = await pool.query(
        `SELECT id, punch_timings FROM eSparkTalentAPI_employee WHERE id = $1`,
        [id]
      );

      if (rows.length === 0) {
        logger.warn(`Employee not found for id=${id}`);
        return res
          .status(404)
          .json({ message: "employee matching query does not exist." });
      }

      const employee = rows[0];
      const checkIn = employee.punch_timings?.check_in || null;
      const checkOut = employee.punch_timings?.check_out || null;

      logger.info(`Time data retrieved for employee id=${id}`);
      return res.status(200).json({
        id: employee.id,
        check_in: checkIn,
        check_out: checkOut,
      });
    } catch (error) {
      logger.error(`Error fetching time data for id=${id}: ${error.message}`);
      return res.status(500).json({ message: error.message });
    }
  } else if (tab === "leaves") {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM eSparkTalentAPI_leave_balance WHERE employee_id = $1`,
        [id]
      );

      if (rows.length === 0) {
        logger.warn(`Leave balance not found for employee id=${id}`);
        return res
          .status(404)
          .json({ error: "employee matching query does not exist." });
      }

      const leaveData = rows[0];
      logger.info(`Leave balance retrieved for employee id=${id}`);
      return res.status(200).json({
        id: id,
        casual_leaves: leaveData.casual_leaves,
        sick_leaves: leaveData.sick_leaves,
        annual_leaves: leaveData.annual_leaves,
        unpaid_leaves: leaveData.unpaid_leaves,
        paid_leaves: leaveData.paid_leaves,
        hajj_leaves: leaveData.hajj_leaves,
      });
    } catch (error) {
      logger.error(`Error fetching leave data for id=${id}: ${error.message}`);
      return res.status(500).json({ message: error.message });
    }
  } else {
    return res.status(400).json({ message: "Invalid tab value" });
  }
};

export default getTimeAndLeave;
