import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"


const getEmployeeLeaveRequests = async (req, res) => {
    const { emp_email } = req.query

    try {
        const today = new Date()
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

        const employee = await pool.query(
            `SELECT id, email, first_name, last_name, job_title FROM eSparkTalentAPI_employee WHERE email = $1`,
            [emp_email],
        )

        if (!employee.rows[0]) {
            logger.error(`Employee with email ${emp_email} not found`)
            return res.status(404).json({ message: "Employee not found" })
        }

        const employeeId = employee.rows[0].id

        const leaveRequests = await pool.query(`
            SELECT lr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.job_title as department, lr.leave_type,
                  TO_CHAR(lr.start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(lr.end_date, 'YYYY-MM-DD') as end_date, lr.count, lr.reason, 
                   lr.created_at as requested_at, lr.status
            FROM eSparkTalentAPI_leave_request lr 
            JOIN eSparkTalentAPI_employee e ON lr.employee_id = e.id 
            WHERE lr.employee_id = $1 
            AND lr.created_at >= $2 
            AND lr.created_at < $3
            ORDER BY lr.created_at DESC
        `, [employeeId, currentMonthStart, nextMonthStart])

        return res.status(200).json(leaveRequests.rows)

    } catch (error) {
        logger.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export default getEmployeeLeaveRequests;