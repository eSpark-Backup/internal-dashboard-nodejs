import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"


const getEmployeeWFHRequests = async (req, res) => {
    const { e_email } = req.query

    try {
        const today = new Date()
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

        const employee = await pool.query(
            `SELECT id, email, first_name, last_name, job_title FROM eSparkTalentAPI_employee WHERE email = $1`,
            [e_email],
        )

        if (!employee.rows[0]) {
            logger.error(`Employee with email ${e_email} not found`)
            return res.status(404).json({ message: "Employee not found" })
        }

        const employeeId = employee.rows[0].id

        const wfhRequests = await pool.query(`
            SELECT wr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.job_title as department, 
                TO_CHAR(wr.start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(wr.end_date, 'YYYY-MM-DD') as end_date, wr.count, wr.status, wr.reason,
                wr.created_at
            FROM eSparkTalentAPI_wfh_request wr 
            JOIN eSparkTalentAPI_employee e ON wr.employee_id = e.id 
            WHERE wr.employee_id = $1
            AND wr.created_at >= $2 
            AND wr.created_at < $3
            ORDER BY wr.created_at DESC
        `, [employeeId, currentMonthStart, nextMonthStart])

        return res.status(200).json(wfhRequests.rows)

    } catch (error) {
        logger.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export default getEmployeeWFHRequests;