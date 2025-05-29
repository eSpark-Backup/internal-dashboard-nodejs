import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"

const getWFHRequests = async (req, res) => {
    const { email } = req.user
    const { tab, from, to } = req.query || {}

    let client

    try {
        client = await pool.connect()

        const employee = await client.query(
            `SELECT id, email, first_name, last_name, job_title FROM eSparkTalentAPI_employee WHERE email = $1`,
            [email],
        )

        if (!employee.rows[0]) {
            logger.error(`Employee with email ${email} not found`)
            return res.status(404).json({ message: "Employee not found" })
        }

        const employeeId = employee.rows[0].id

        let requestQuery = `
            SELECT wr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.job_title as department, 
                  TO_CHAR(wr.start_date, 'YYYY-MM-DD') as start_date, TO_CHAR(wr.end_date, 'YYYY-MM-DD') as end_date, wr.count, wr.status, wr.reason,
                   wr.created_at
            FROM eSparkTalentAPI_wfh_request wr 
            JOIN eSparkTalentAPI_employee e ON wr.employee_id = e.id 
            WHERE wr.employee_id = $1
        `

        let countQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) as all
            FROM eSparkTalentAPI_wfh_request wr
            WHERE wr.employee_id = $1
        `

        const requestQueryParams = [employeeId]
        const countQueryParams = [employeeId]

        if (tab) {
            requestQueryParams.push(tab)
            countQueryParams.push(tab)
            requestQuery += ` AND wr.status = $${requestQueryParams.length}`
            countQuery += ` AND wr.status = $${countQueryParams.length}`
        }

        if (from) {
            requestQueryParams.push(from)
            countQueryParams.push(from)
            requestQuery += ` AND DATE(wr.created_at) >= $${requestQueryParams.length}`
            countQuery += ` AND DATE(wr.created_at) >= $${countQueryParams.length}`
        }

        if (to) {
            requestQueryParams.push(to)
            countQueryParams.push(to)
            requestQuery += ` AND DATE(wr.created_at) <= $${requestQueryParams.length}`
            countQuery += ` AND DATE(wr.created_at) <= $${countQueryParams.length}`
        }

        requestQuery += ` ORDER BY wr.created_at DESC`

        const [requests, counts] = await Promise.all([
            client.query(requestQuery, requestQueryParams),
            client.query(countQuery, countQueryParams),
        ])

        const countsData = counts.rows[0]


        const response = {
            requests: requests.rows,
            pending: Number.parseInt(countsData.pending) || 0,
            rejected: Number.parseInt(countsData.rejected) || 0,
            completed: Number.parseInt(countsData.completed) || 0,
            all: Number.parseInt(countsData.all) || 0,
        }

        return res.status(200).json(response)
    } catch (error) {
        logger.error(`Error fetching WFH requests: ${error.message}`)
        return res.status(500).json({ error: "Internal server error" })
    } finally {
        if (client) {
            client.release()
        }
    }
}

export default getWFHRequests
