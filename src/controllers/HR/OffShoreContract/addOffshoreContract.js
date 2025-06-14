import fs from "fs";
import path from "path";

import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import { getFormattedTimestamp } from "../../../helpers/utils.js";

const addOffshoreContract = async (req, res) => {
  const { client_id, employee_id, contract_name, date } = req.body;
  const contract_doc = req.files?.contract_doc?.[0];
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Fetch client email using client_id
    const clientResult = await client.query(
      `SELECT id, email FROM eSparkTalentAPI_client WHERE client_id = $1`,
      [client_id]
    );
    if (!clientResult.rows.length) {
      return res
        .status(404)
        .json({ message: "client matching query does not exist." });
    }

    // Fetch employee email using employee_id
    const empResult = await client.query(
      `SELECT id, email FROM eSparkTalentAPI_employee WHERE employee_id = $1`,
      [employee_id]
    );
    if (!empResult.rows.length) {
      return res
        .status(404)
        .json({ message: "employee matching query does not exist." });
    }

    const employeeEmail = empResult.rows[0].email;
    const clientEmail = clientResult.rows[0].email;
    const empId = empResult.rows[0].id;
    const clientId = clientResult.rows[0].id;
    // Check outsource_employees for active status
    const outsrcResult = await client.query(
      `SELECT status FROM eSparkTalentAPI_outsource_employees WHERE employee_id = $1 AND client_id = $2`,
      [empId, clientId]
    );

    if (!outsrcResult.rows.length || outsrcResult.rows[0].status !== "active") {
      return res
        .status(400)
        .json({ message: "Cannot create contract for terminated employee" });
    }

    // Validate uploaded file
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
      return res
        .status(400)
        .json({ message: "Invalid file", errors: fileErrors });
    }

    // Upload to S3
    let contractDocUrl = null;
    try {
      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(contract_doc.originalname);
      const s3Key = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;
      const fileContent = fs.readFileSync(contract_doc.path);
      await uploadToS3(s3Key, fileContent, contract_doc.mimetype);
      fs.unlinkSync(contract_doc.path);
      contractDocUrl = s3Key;
    } catch (error) {
      logger.error(`Error uploading contract_doc: ${error.message}`);
      if (contract_doc && fs.existsSync(contract_doc.path)) {
        fs.unlinkSync(contract_doc.path);
      }
      return res.status(500).json({ message: "File upload failed" });
    }

    // Insert contract + notifications

    const contractInsert = await client.query(
      `INSERT INTO eSparkTalentAPI_offshore_contracts (employee_id, client_id, contract_name, date, contract_doc)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [empId, clientId, contract_name, date, contractDocUrl]
    );

    const contractId = contractInsert.rows[0].id;

    const notiQuery = `
      INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, status, description)
      VALUES ($1, $2, 'offshore_contracts', 'added', $3)
    `;

    await client.query(notiQuery, [
      clientEmail,
      contractId,
      `${contract_name} contract is added`,
    ]);
    await client.query(notiQuery, [
      employeeEmail,
      contractId,
      `${contract_name} contract is added`,
    ]);

    await client.query("COMMIT");

    return res.status(201).json({
      message: "One new contract has been added to offshore contracts",
      id: contractId,
      client_email: clientEmail,
      employee_email: employeeEmail,
    });
  } catch (err) {
    logger.error(err);
    if (client) await client.query("ROLLBACK");
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    if (client) client.release();
  }
};

export default addOffshoreContract;
