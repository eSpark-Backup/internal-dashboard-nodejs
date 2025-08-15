import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";


const addCompanyContract = async (req, res) => {
    const { status } = req.query;
    
    let client;

    switch (status) {
        case "client":
            try {
                const { date, contract_name, client_id } = req.body;
                const contract_doc = req.files?.contract_doc?.[0];

                client = await pool.connect();

                const clientResult = await client.query(
                    `SELECT id, email FROM eSparkTalentAPI_client WHERE client_id = $1`,
                    [client_id]
                );

                if (!clientResult.rows[0]) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(404).json({ message: "Client with this ID does not exist" });
                }

                const fileErrors = {};
                const contractDocValidationErrors = validateFile({
                    file: contract_doc,
                    name: "contract_doc",
                    required: true,
                    allowedTypes: ["application/pdf"],
                    maxSizeMB: 5,
                });

                Object.assign(fileErrors, contractDocValidationErrors || {});

                if (Object.keys(fileErrors).length > 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
                }

                let contractDocUrl = null;

                try {
                    if (contract_doc) {
                        const timestamp = getFormattedTimestamp();
                        const fileName = path.basename(contract_doc.originalname);
                        const s3ImageKey = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;

                        const fileContent = fs.readFileSync(contract_doc.path);
                        await uploadToS3(s3ImageKey, fileContent, contract_doc.mimetype);
                        await cleanupFiles([{ localPath: contract_doc?.path }]);

                        contractDocUrl = s3ImageKey;
                    }
                }
                catch (error) {
                    logger.error(`Error uploading guide document: ${error.message}`);
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(500).json({ message: "Internal server error" });
                }

                client.query('BEGIN');

                const contractResult = await client.query(
                    `INSERT INTO eSparkTalentAPI_client_contract (date, contract_name, client_id, contract_doc) VALUES ($1, $2, $3, $4) RETURNING id`,
                    [date, contract_name, clientResult.rows[0].id, contractDocUrl]
                );

                if (!contractResult.rows[0].id) {
                    await cleanupFiles([{ localPath: contract_doc?.path, s3Key: contractDocUrl }]);
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to add contract" });
                }

                const notification = await client.query(
                    `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [clientResult.rows[0].email, contractResult.rows[0].id, "client_contract", `${contract_name} contract is pending`, "added"]
                );

                if (!notification.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    await cleanupFiles([{ localPath: contract_doc?.path, s3Key: contractDocUrl }]);
                    return res.status(400).json({ message: "Failed to add notification" });
                }

                await client.query("COMMIT");
                return res.status(200).json({ message: "New contract has been added successfully", id: contractResult.rows[0].id });
            }
            catch (error) {
                logger.error(error);
                 if (client) await client.query("ROLLBACK")
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        case "employee":
            try {
                const { date, contract_name, employee_id } = req.body;
                const contract_doc = req.files?.contract_doc?.[0];

                client = await pool.connect();

                const employeeResult = await client.query(
                    `SELECT id, email FROM eSparkTalentAPI_employee WHERE employee_id = $1`,
                    [employee_id]
                );

                if (!employeeResult.rows[0]) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(404).json({ message: "Employee with this ID does not exist" });
                }

                const fileErrors = {};
                const contractDocValidationErrors = validateFile({
                    file: contract_doc,
                    name: "contract_doc",
                    required: true,
                    allowedTypes: ["application/pdf"],
                    maxSizeMB: 5,
                });

                Object.assign(fileErrors, contractDocValidationErrors || {});

                if (Object.keys(fileErrors).length > 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
                }

                let contractDocUrl = null;

                try {
                    if (contract_doc) {
                        const timestamp = getFormattedTimestamp();
                        const fileName = path.basename(contract_doc.originalname);
                        const s3ImageKey = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;

                        const fileContent = fs.readFileSync(contract_doc.path);
                        await uploadToS3(s3ImageKey, fileContent, contract_doc.mimetype);
                        await cleanupFiles([{ localPath: contract_doc?.path }]);

                        contractDocUrl = s3ImageKey;
                    }
                }
                catch (error) {
                    logger.error(`Error uploading guide document: ${error.message}`);
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(500).json({ message: "Internal server error" });
                }

                client.query('BEGIN');

                const contractResult = await client.query(
                    `INSERT INTO eSparkTalentAPI_employee_contract (date, contract_name, employee_id, contract_doc) VALUES ($1, $2, $3, $4) RETURNING id`,
                    [date, contract_name, employeeResult.rows[0].id, contractDocUrl]
                );

                if (!contractResult.rows[0].id) {
                    await client.query("ROLLBACK");
                    await cleanupFiles([{ localPath: contract_doc?.path, s3Key: contractDocUrl }]);
                    return res.status(400).json({ message: "Failed to add contract" });
                }

                const notification = await client.query(
                    `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [employeeResult.rows[0].email, contractResult.rows[0].id, "employee_contract", `${contract_name} contract is pending`, "added"]
                );

                if (!notification.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    await cleanupFiles([{ localPath: contract_doc?.path, s3Key: contractDocUrl }]);
                    return res.status(400).json({ message: "Failed to add notification" });
                }

                await client.query("COMMIT");

                return res.status(200).json({ message: "New contract has been added successfully", id: contractResult.rows[0].id });
            }
            catch (error) {
                logger.error(error);
                if (client) await client.query("ROLLBACK")
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        default:
            return res.status(400).json({ message: "Invalid status" });
    }


}


export default addCompanyContract;

