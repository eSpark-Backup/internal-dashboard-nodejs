import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import path from "path";
import fs from "fs";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";



const updateCompanyContract = async (req, res) => {
    const { id, tab } = req.query;
    const { contract_name, date } = req.body || {};
    const contract_doc = req.files?.contract_doc?.[0];

    if (!contract_name && !date && !contract_doc) {
        return res.status(400).json({ message: "Missing contract name or date or contract document" });
    }

    switch (tab) {
        case "client":
            try {

                const clientContract = await pool.query(
                    `SELECT id, contract_doc FROM eSparkTalentAPI_client_contract WHERE id = $1`,
                    [id]
                );

                if (clientContract.rowCount === 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(404).json({ message: "Client contract with given id not found" });
                }

                let contract_doc_url = clientContract.rows[0].contract_doc;

                try {
                    if (contract_doc) {
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

                        const timestamp = getFormattedTimestamp();
                        const fileName = path.basename(contract_doc.originalname);
                        const s3ImageKey = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;

                        const fileContent = fs.readFileSync(contract_doc.path);
                        await uploadToS3(s3ImageKey, fileContent, contract_doc.mimetype);
                        await cleanupFiles([{ localPath: contract_doc?.path }]);

                        contract_doc_url = s3ImageKey;
                    }
                }
                catch (error) {
                    logger.error(error);
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(500).json({ message: "Internal server error" });
                }

                const updatedClientContract = await pool.query(
                    `UPDATE eSparkTalentAPI_client_contract 
                    SET contract_name = COALESCE($1, contract_name),
                        date = COALESCE($2, date),
                        contract_doc = COALESCE($3, contract_doc),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4`,
                    [contract_name, date, contract_doc_url, id]
                );

                if (updatedClientContract.rowCount === 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(400).json({ message: "Failed to update client contract" });
                }

                return res.status(200).json({ message: "Client contract updated successfully" });

            }
            catch (error) {
                logger.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        case "employee":
            try {

                const employeeContract = await pool.query(
                    `SELECT id, contract_doc FROM eSparkTalentAPI_employee_contract WHERE id = $1`,
                    [id]
                );

                if (employeeContract.rowCount === 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(404).json({ message: "Employee contract with given id not found" });
                }

                let contract_doc_url = employeeContract.rows[0].contract_doc;

                try {
                    if (contract_doc) {
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

                        const timestamp = getFormattedTimestamp();
                        const fileName = path.basename(contract_doc.originalname);
                        const s3ImageKey = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;

                        const fileContent = fs.readFileSync(contract_doc.path);
                        await uploadToS3(s3ImageKey, fileContent, contract_doc.mimetype);
                        await cleanupFiles([{ localPath: contract_doc?.path }]);

                        contract_doc_url = s3ImageKey;
                    }
                }
                catch (error) {
                    logger.error(error);
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(500).json({ message: "Internal server error" });
                }

                const updatedEmployeeContract = await pool.query(
                    `UPDATE eSparkTalentAPI_employee_contract 
                    SET contract_name = COALESCE($1, contract_name),
                        date = COALESCE($2, date),
                        contract_doc = COALESCE($3, contract_doc),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4`,
                    [contract_name, date, contract_doc_url, id]
                );

                if (updatedEmployeeContract.rowCount === 0) {
                    await cleanupFiles([{ localPath: contract_doc?.path }]);
                    return res.status(400).json({ message: "Failed to update employee contract" });
                }

                return res.status(200).json({ message: "Employee contract updated successfully" });

            }
            catch (error) {
                logger.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        default:
            return res.status(400).json({ message: "Invalid tab" });
    }



}

export default updateCompanyContract;
