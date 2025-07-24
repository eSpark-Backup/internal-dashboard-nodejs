import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";


const deleteOnboarding = async (req, res) => {
    const { id } = req.query;

    let client;
    try {
        client = await pool.connect();

        const onboarding = await client.query(
            `SELECT id FROM eSparkTalentAPI_onboarding WHERE id = $1`,
            [id]
        );

        if (onboarding.rowCount === 0) {
            return res.status(404).json({ message: "Onboarding does not exist with given id" });
        }

        await client.query("BEGIN");

        await client.query(
            `DELETE FROM eSparkTalentAPI_onboarding WHERE id = $1`,
            [id]
        );

        const notification = await client.query(
            `SELECT id FROM eSparkTalentAPI_notifications WHERE ref_id = $1 AND notification_type = 'onboarding'`,
            [id]
        );

        if (notification.rows[0]) {
            await client.query(
                `DELETE FROM eSparkTalentAPI_notifications WHERE ref_id = $1`,
                [id]
            );
        }

        await client.query("COMMIT");
        return res.status(200).json({ message: "Onboarding has been deleted" });

    } catch (error) {
        if (client) await client.query("ROLLBACK");
        logger.error(`Error deleting onboarding: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteOnboarding;
