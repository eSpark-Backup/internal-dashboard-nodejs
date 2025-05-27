import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"

const getPunchRequests = async (req, res) => {
    const { email } = req.user
    const { workspace, tab, from, to } = req.query || {}

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

        const clientResult = await client.query(
            `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`,
            [workspace],
        )

        if (!clientResult.rows[0]) {
            logger.error(`Client with email ${workspace} not found`)
            return res.status(404).json({ message: "Workspace not found" })
        }

        const clientId = clientResult.rows[0].id

        let requestQuery = `
            SELECT pr.id, e.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                  TO_CHAR(pr.date, 'YYYY-MM-DD') as date, pr.punch_type, pr.punch_time, pr.description, pr.status,
                   pr.created_at
            FROM eSparkTalentAPI_punch_request pr 
            JOIN eSparkTalentAPI_employee e ON pr.employee_id = e.id 
            WHERE pr.client_id = $1 AND pr.employee_id = $2
        `

        let countQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) as all
            FROM eSparkTalentAPI_punch_request pr
            WHERE pr.client_id = $1 AND pr.employee_id = $2
        `

        const requestQueryParams = [clientId, employeeId]
        const countQueryParams = [clientId, employeeId]

        if (tab) {
            requestQueryParams.push(tab)
            countQueryParams.push(tab)
            requestQuery += ` AND pr.status = $${requestQueryParams.length}`
            countQuery += ` AND pr.status = $${countQueryParams.length}`
        }

        if (from) {
            requestQueryParams.push(from)
            countQueryParams.push(from)
            requestQuery += ` AND DATE(pr.created_at) >= $${requestQueryParams.length}`
            countQuery += ` AND DATE(pr.created_at) >= $${countQueryParams.length}`
        }

        if (to) {
            requestQueryParams.push(to)
            countQueryParams.push(to)
            requestQuery += ` AND DATE(pr.created_at) <= $${requestQueryParams.length}`
            countQuery += ` AND DATE(pr.created_at) <= $${countQueryParams.length}`
        }

        requestQuery += ` ORDER BY pr.created_at DESC`

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

export default getPunchRequests
