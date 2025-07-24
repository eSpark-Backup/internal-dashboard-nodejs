import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";

const deleteClient = async (req, res) => {
    const { id } = req.query;
    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");
        logger.info(`Started deletion for client ID: ${id}`);

        const clientResult = await client.query(
            `SELECT * FROM eSparkTalentAPI_client WHERE id = $1`,
            [id]
        );

        if (!clientResult.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Client with this ID not found" });
        }

        const userResult = await client.query(
            `SELECT email FROM eSparkTalentAPI_end_user WHERE email = $1`,
            [clientResult.rows[0].email]
        );

        if (!userResult.rows.length) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User with client's email not found" });
        }

        const clientData = clientResult.rows[0];
        const clientEmail = clientData.email;
        const clientName = `${clientData.first_name} ${clientData.last_name}`;

        const fileTables = [
            { table: "eSparkTalentAPI_employee_invoice", field: "invoice" },
            { table: "eSparkTalentAPI_client_contract", field: "contract_doc" },
            { table: "eSparkTalentAPI_offshore_contracts", field: "contract_doc" },
            { table: "eSparkTalentAPI_other_payment", field: "invoice" },
        ];

        for (const { table, field } of fileTables) {
            const result = await client.query(
                `SELECT ${field} FROM ${table} WHERE client_id = $1`,
                [id]
            );

            for (const row of result.rows) {
                if (row[field]) {
                    const removed = await removeFromS3(row[field]);
                    if (removed?.error) {
                        logger.error(`Failed to delete file from S3: ${row[field]} - ${removed.error}`);
                    }
                }
            }
        }

        if (clientData.image) {
            const removed = await removeFromS3(clientData.image);
            if (removed?.error) {
                logger.error(`Failed to delete client image from S3: ${clientData.image} - ${removed.error}`);
            }
        }

        await client.query(
            `DELETE FROM eSparkTalentAPI_end_user WHERE email = $1`,
            [clientEmail]
        );

        await client.query(
            `DELETE FROM eSparkTalentAPI_client WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");
        logger.info(`Client ${clientName} deleted successfully`);

        return res.status(200).json({ message: `${clientName} is removed successfully` });
    } catch (error) {
        if (client) await client.query("ROLLBACK");
        logger.error(`Error deleting client: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }
};

export default deleteClient;
