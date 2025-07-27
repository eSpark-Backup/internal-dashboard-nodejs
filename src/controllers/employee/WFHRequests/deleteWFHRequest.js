import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"


const deleteWFHRequest = async (req, res) => {
    const { id } = req.query;

    let client;

    try {
        
        client = await pool.connect();

        const wfhRequest = await client.query(
            `SELECT * FROM eSparkTalentAPI_wfh_request WHERE id = $1`,
            [id]
        );

        if (!wfhRequest.rows[0]) {
            return res.status(404).json({ message: "WFH request does not exist with given id" });
        }

        await client.query("BEGIN");

        // Delete wfh request
        await client.query(
            `DELETE FROM eSparkTalentAPI_wfh_request WHERE id = $1`,
            [id]
        );

        // Delete notification if exists
        const notification = await client.query(
            `SELECT * FROM eSparkTalentAPI_notifications WHERE ref_id = $1`,
            [id]
        );

        if (notification.rows[0]) {
            await client.query(
                `DELETE FROM eSparkTalentAPI_notifications WHERE ref_id = $1`,
                [id]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "WFH request has been deleted" });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`Error deleting wfh request: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteWFHRequest
