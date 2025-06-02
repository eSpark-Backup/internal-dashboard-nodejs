import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"

const updateEmployeeWFHRequest = async (req, res) => {
    const { id } = req.query
    const { status } = req.body

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const wfhRequest = await client.query(
            'SELECT id FROM eSparkTalentAPI_wfh_request WHERE id = $1',
            [id]
        )

        if (wfhRequest.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ message: "WFH request not found" })
        }

        await client.query(
            'UPDATE eSparkTalentAPI_wfh_request SET status = $1 WHERE id = $2',
            [status, id]
        )

        await client.query(
            `UPDATE eSparkTalentAPI_notifications 
             SET status = $1, description = $2 
             WHERE ref_id = $3`,
            [status, `WFH request is ${status}`, id]
        )

        await client.query('COMMIT')
        return res.status(200).json({ message: `WFH request updated as ${status}` })

    } catch (error) {
        await client.query('ROLLBACK')
        logger.error(error)
        return res.status(500).json({ message: "Internal server error" })
    } finally {
        if (client) client.release()
    }
}

export default updateEmployeeWFHRequest