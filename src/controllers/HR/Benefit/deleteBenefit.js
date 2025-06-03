import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";


const deleteBenefit = async (req, res) => {
    const { id } = req.query;

    let client;
    try {
        client = await pool.connect();

        const benefit = await client.query(
            `SELECT * FROM eSparkTalentAPI_benefits WHERE id = $1`,
            [id]
        );

        if (!benefit.rows[0]) {
            return res.status(404).json({ message: "Benefit does not exist with given id" });
        }

        await client.query("BEGIN");

        // Delete benefit
        await client.query(
            `DELETE FROM eSparkTalentAPI_benefits WHERE id = $1`,
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
        return res.status(200).json({ message: "Benefit has been deleted" });

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`Error deleting benefit: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteBenefit;
