import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";


const deleteCompanyContract = async (req, res) => {
    const { id, status } = req.query;

    let client;
    
    switch (status) {
        case "clients":
            try {
                client = await pool.connect();


                const clientContract = await client.query(
                    `SELECT id, contract_doc FROM eSparkTalentAPI_client_contract WHERE id = $1`,
                    [id]
                );

                if (clientContract.rowCount === 0) {
                    return res.status(404).json({ message: "Client contract with the given ID not found" });
                }

                const { contract_doc } = clientContract.rows[0];

                await client.query("BEGIN");

                const contractResult = await client.query(
                    `DELETE FROM eSparkTalentAPI_client_contract WHERE id = $1 RETURNING id`,
                    [id]
                );

                if (!contractResult.rows[0].id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to delete contract" });
                }

                await client.query(
                    `DELETE FROM eSparkTalentAPI_notifications 
                         WHERE ref_id = $1 AND notification_type = 'client_contract'`,
                    [id]
                );

                try {
                    if (contract_doc) await removeFromS3(contract_doc);
                } catch (err) {
                    logger.warn(`Failed to remove contract document from S3: ${err}`);
                }


                await client.query("COMMIT");


                return res.status(200).json({ message: "Client contract deleted successfully" });
            }
            catch (error) {
                logger.error(error);
                if (client) await client.query("ROLLBACK");
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        case "employees":
            try {
                client = await pool.connect();

                const employeeContract = await client.query(
                    `SELECT id, contract_doc FROM eSparkTalentAPI_employee_contract WHERE id = $1`,
                    [id]
                );

                if (employeeContract.rowCount === 0) {
                    return res.status(404).json({ message: "Employee contract with the given ID not found" });
                }

                const { contract_doc } = employeeContract.rows[0];

                await client.query("BEGIN");

                const contractResult = await client.query(
                    `DELETE FROM eSparkTalentAPI_employee_contract WHERE id = $1 RETURNING id`,
                    [id]
                );

                if (!contractResult.rows[0].id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to delete contract" });
                }

                await client.query(
                    `DELETE FROM eSparkTalentAPI_notifications 
                         WHERE ref_id = $1 AND notification_type = 'employee_contract'`,
                    [id]
                );

                try {
                    if (contract_doc) await removeFromS3(contract_doc);
                } catch (err) {
                    logger.warn(`Failed to remove contract document from S3: ${err}`);
                }

                await client.query("COMMIT");

                return res.status(200).json({ message: "Employee contract deleted successfully" });
            }
            catch (error) {
                logger.error(error);
                if (client) await client.query("ROLLBACK");
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        default:
            return res.status(400).json({ message: "Invalid status" });
    }

}

export default deleteCompanyContract;
