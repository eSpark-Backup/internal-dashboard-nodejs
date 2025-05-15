import { validateFile } from "../../utils/validateFiles.js";
import pool from "../../config/db.js";
import { getFormattedTimestamp } from "../../helpers/utils.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../helpers/s3.js";
import fs from "fs";
import path from "path";

export const updateLetter = async (req, res) => {
  const client = await pool.connect();
  try {
    const { reason, objective, issue_date } = req.body;
    const letterFile = req.file;

    const id = parseInt(req.query.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ id: ["Invalid ID"] });
    }

    await client.query("BEGIN");
    console.log("id here", id, typeof id);
    // Check if the letter with given ID exists
    const letterRes = await client.query(
      `SELECT * FROM esparktalentapi_letter WHERE id = $1`,
      [id]
    );

    if (letterRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Letter not found" });
    }

    let updatedLetterPath = null;

    if (letterFile) {
      const fileErrors =
        validateFile({
          file: letterFile,
          name: "letter",
          allowedTypes: ["application/pdf"],
          maxSizeMB: 5,
        }) || {};

      if (Object.keys(fileErrors).length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json(fileErrors);
      }

      const timestamp = getFormattedTimestamp();
      const fileName = path.basename(letterFile.originalname);
      const s3Key = `${S3_TEMP_BUCKET}/employees/letters/${timestamp}_${fileName}`;
      const fileContent = fs.readFileSync(letterFile.path);

      await uploadToS3(s3Key, fileContent, letterFile.mimetype);
      fs.unlinkSync(letterFile.path);

      updatedLetterPath = s3Key;
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (reason) {
      fieldsToUpdate.push(`reason = $${paramIndex++}`);
      values.push(reason);
    }

    if (objective) {
      fieldsToUpdate.push(`objective = $${paramIndex++}`);
      values.push(objective);
    }

    if (issue_date) {
      fieldsToUpdate.push(`issue_date = $${paramIndex++}`);
      values.push(issue_date);
    }

    if (updatedLetterPath) {
      fieldsToUpdate.push(`letter = $${paramIndex++}`);
      values.push(updatedLetterPath);
    }

    if (fieldsToUpdate.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const updateQuery = `
      UPDATE esparktalentapi_letter
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${paramIndex}
    `;

    await client.query(updateQuery, values);
    await client.query("COMMIT");

    return res.status(200).json({ message: "Letter updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Letter update error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
