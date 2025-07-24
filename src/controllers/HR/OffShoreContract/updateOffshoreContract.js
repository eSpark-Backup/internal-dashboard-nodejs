import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { validateFile } from "../../../utils/validateFiles.js";
import {
  S3_TEMP_BUCKET,
  uploadToS3,
  removeFromS3,
} from "../../../helpers/s3.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";

const updateOffshoreContract = async (req, res) => {
  const { id } = req.query;
  const { contract_name, date, employee_id, client_id } = req.body || {};
  const contract_doc = req.files?.contract_doc?.[0];

  if (!contract_name && !date && !contract_doc && !employee_id && !client_id) {
    await cleanupFiles([{ localPath: contract_doc?.path }]);
    return res.status(400).json({ message: "Nothing to update" });
  }

  let client;

  try {

    client = await pool.connect();

    await client.query("BEGIN");
    
    const existingRes = await client.query(
      `SELECT contract_doc FROM eSparkTalentAPI_offshore_contracts WHERE id = $1`,
      [id]
    );

    if (existingRes.rowCount === 0) {
      await cleanupFiles([{ localPath: contract_doc?.path }]);
      return res.status(404).json({ message: "Offshore contract not found" });
    }

    let contract_doc_url = existingRes.rows[0].contract_doc;

    if (contract_doc) {
      const fileErrors =
        validateFile({
          file: contract_doc,
          name: "contract_doc",
          required: true,
          allowedTypes: ["application/pdf"],
          maxSizeMB: 5,
        }) || {};

      if (Object.keys(fileErrors).length > 0) {
        await cleanupFiles([{ localPath: contract_doc?.path }]);
        return res
          .status(400)
          .json({ message: "Invalid contract_doc", errors: fileErrors });
      }

      if (contract_doc_url) {
        await removeFromS3(contract_doc_url).catch((err) =>
          logger.warn("Could not remove old contract from S3:", err)
        );
      }

      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(contract_doc.originalname);
      const s3Key = `${S3_TEMP_BUCKET}/contracts/${timestamp}_${fileName}`;
      const fileContent = fs.readFileSync(contract_doc.path);

      await uploadToS3(s3Key, fileContent, contract_doc.mimetype);
      await cleanupFiles([{ localPath: contract_doc?.path }]);
      contract_doc_url = s3Key;
    }

    let resolvedEmployeeId = null;
    let resolvedClientId = null;

    if (employee_id) {
      const empRes = await client.query(
        `SELECT id FROM eSparkTalentAPI_employee WHERE employee_id = $1`,
        [employee_id]
      );
      if (empRes.rowCount === 0) {
        await client.query("ROLLBACK");
        await cleanupFiles([{ localPath: contract_doc?.path }]);
        return res.status(404).json({ message: "Employee not found" });
      }
      resolvedEmployeeId = empRes.rows[0].id;
    }

    if (client_id) {
      const clRes = await client.query(
        `SELECT id FROM eSparkTalentAPI_client WHERE client_id = $1`,
        [client_id]
      );
      if (clRes.rowCount === 0) {
        await client.query("ROLLBACK");
        await cleanupFiles([{ localPath: contract_doc?.path }]);
        return res.status(404).json({ message: "Client not found" });
      }
      resolvedClientId = clRes.rows[0].id;
    }

    const result = await client.query(
      `
      UPDATE eSparkTalentAPI_offshore_contracts 
      SET
        contract_name = COALESCE($1, contract_name),
        date = COALESCE($2, date),
        contract_doc = COALESCE($3, contract_doc),
        employee_id = COALESCE($4, employee_id),
        client_id = COALESCE($5, client_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `,
      [
        contract_name || null,
        date || null,
        contract_doc_url || null,
        resolvedEmployeeId || null,
        resolvedClientId || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      await cleanupFiles([{ localPath: contract_doc?.path }]);
      return res
        .status(400)
        .json({ message: "Failed to update offshore contract" });
    }

    await client.query("COMMIT");
    return res
      .status(200)
      .json({ message: "Offshore contract updated successfully" });
  } catch (err) {
    logger.error(err);
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default updateOffshoreContract;
