import { parseISO } from "date-fns";
import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getEmployeeByEmail = async (email) => {
  const res = await pool.query(
    "SELECT id, employee_id, first_name, last_name, job_title FROM eSparkTalentAPI_employee WHERE email = $1",
    [email]
  );
  return res.rows[0];
};

const getClientIdByEmail = async (email) => {
  const res = await pool.query(
    "SELECT id FROM eSparkTalentAPI_client WHERE email = $1",
    [email]
  );
  return res.rows[0]?.id;
};

const getLeaveStats = async (employeeId, clientId, dateFilter) => {
  let query = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) as all
    FROM eSparkTalentAPI_leave_request
    WHERE employee_id = $1 AND client_id = $2
  `;
  const params = [employeeId, clientId];

  if (dateFilter.length) {
    query += ` AND created_at::date BETWEEN $3 AND $4`;
    params.push(...dateFilter);
  }

  const res = await pool.query(query, params);
  return {
    pending: parseInt(res.rows[0].pending),
    rejected: parseInt(res.rows[0].rejected),
    completed: parseInt(res.rows[0].completed),
    all: parseInt(res.rows[0].all),
  };
};

const getLeaveRequests = async (employeeId, clientId, tab, dateFilter) => {
  let query = `SELECT * FROM eSparkTalentAPI_leave_request WHERE employee_id = $1 AND client_id = $2`;
  const params = [employeeId, clientId];
  let idx = 3;

  if (dateFilter.length) {
    query += ` AND created_at::date BETWEEN $${idx} AND $${idx + 1}`;
    params.push(...dateFilter);
    idx += 2;
  }

  if (tab) {
    query += ` AND status = $${idx}`;
    params.push(tab);
  }

  query += ` ORDER BY created_at DESC`;
  const res = await pool.query(query, params);
  return res.rows;
};

const getLeaveBalance = async (employeeId, clientId) => {
  const res = await pool.query(
    "SELECT * FROM eSparkTalentAPI_leave_balance WHERE employee_id = $1",
    [employeeId]
  );
  const balance = res.rows[0];
  if (!balance) return null;

  delete balance.created_at;
  delete balance.updated_at;
  delete balance.employee_id;

  const leaveTypes = [
    "casual_leaves",
    "sick_leaves",
    "annual_leaves",
    "unpaid_leaves",
    "paid_leaves",
    "hajj_leaves",
  ];

  for (const type of leaveTypes) {
    balance[type].pending = 0;
  }

  const countRes = await pool.query(
    `SELECT leave_type, COUNT(*) as count
     FROM eSparkTalentAPI_leave_request
     WHERE employee_id = $1 AND client_id = $2 AND status = 'pending'
     GROUP BY leave_type`,
    [employeeId, clientId]
  );

  for (const row of countRes.rows) {
    const key = `${row.leave_type}_leaves`;
    if (balance[key]) {
      balance[key].pending = parseInt(row.count);
    }
  }

  return balance;
};

const getLeaveRequest = async (req, res) => {
  const { email } = req.user;
  const { workspace, tab, from, to } = req.query;

  try {
    const employee = await getEmployeeByEmail(email);
    if (!employee)
      return res.status(404).json({ message: "Employee not found." });

    const clientId = await getClientIdByEmail(workspace);
    if (!clientId)
      return res.status(404).json({ message: "Client not found." });

    const employeeId = employee.id;
    const employeeCode = employee.employee_id;
    const dateFilter = from && to ? [parseISO(from), parseISO(to)] : [];

    const stats = await getLeaveStats(employeeId, clientId, dateFilter);

    const leaveRequests = await getLeaveRequests(
      employeeId,
      clientId,
      tab,
      dateFilter
    );

    const requests = leaveRequests.map((req) => ({
      id: req.id,
      employee_id: employeeCode,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      department: employee.job_title,
      leave_type: req.leave_type,
      requested_at: req.created_at,
      count: req.count,
      status: req.status,
      start_date: req.start_date,
      end_date: req.end_date,
      reason: req.reason,
    }));

    if (!from || !to) {
      const balance = await getLeaveBalance(employeeId, clientId);
      console.log("balance", balance);
      if (!balance)
        return res.status(400).json({ message: "Leave balance not found." });

      return res.status(200).json({
        balance,
        requests,
        ...stats,
      });
    }

    return res.status(requests.length ? 200 : 204).json({
      requests,
      ...stats,
    });
  } catch (error) {
    logger.error("GET /emp_lr/ error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default getLeaveRequest;
