import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"


const getEmployeePunchRequests = async (req, res) => {
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

        const punchRequests = await pool.query(`
            SELECT pr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                  TO_CHAR(pr.date, 'YYYY-MM-DD') as date, pr.punch_type, pr.punch_time, pr.description, pr.status,
                   pr.created_at
            FROM eSparkTalentAPI_punch_request pr 
            JOIN eSparkTalentAPI_employee e ON pr.employee_id = e.id 
            WHERE pr.employee_id = $1 
            AND pr.created_at >= $2 
            AND pr.created_at < $3
            ORDER BY pr.created_at DESC
        `, [employeeId, currentMonthStart, nextMonthStart])

        return res.status(200).json(punchRequests.rows)

    } catch (error) {
        logger.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export default getEmployeePunchRequests;