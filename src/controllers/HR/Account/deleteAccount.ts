import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"
import { removeFromS3 } from "../../../helpers/s3.js" 

const deleteAccount = async (req, res) => {
    const { id } = req.query;

    let client;

    try {
        
        client = await pool.connect();

        await client.query("BEGIN");

        const { rows: userRows } = await client.query(
            "SELECT email, image FROM eSparkTalentAPI_account_n_persmission WHERE id = $1",
            [id]
        );

        if (userRows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Account not found with this id" });
        }

        const { email, image } = userRows[0];


        await client.query("DELETE FROM eSparkTalentAPI_account_n_persmission WHERE id = $1", [id]);

        const endUserDeleted = await client.query(
            "DELETE FROM eSparkTalentAPI_end_user WHERE email = $1",
            [email]
        );

        if (endUserDeleted.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "End user account not found" });
        }

        try {
            if (image) await removeFromS3(image);
        } catch (err) {
            logger.warn(`Failed to remove image from S3: ${err}`);
        }

        await client.query("COMMIT");
        logger.info(`Account deleted successfully: ${id}`);
        return res.status(200).json({ message: "Account deleted successfully" });

    } catch (error) {
        client.query("ROLLBACK");
        logger.error(`Delete account error: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteAccount;
