import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3, uploadToS3 } from "../../../helpers/s3.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { cleanupFiles } from "../../../helpers/utils.js";

const S3_FOLDER = "company/logo/";

const patchCompanySettings = async (req, res) => {
  const { company_name, company_email, website_url } = req.body;
  const imageFile = req.files?.image?.[0];

  let client;
  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, image FROM eSparkTalentAPI_company_data LIMIT 1`
    );

    let imageUrl = result.rows[0]?.image || null;

    if (imageFile) {
      const fileErrors = validateFile({
        file: imageFile,
        name: "image",
        required: true,
        allowedTypes: ["image/jpeg", "image/png", "image/jpg", "image/svg"],
        maxSizeMB: 5,
      });

      if (fileErrors) {
        await cleanupFiles([{ localPath: imageFile?.path }]);
        return res
          .status(400)
          .json({ message: "Invalid image", errors: fileErrors });
      }

      if (imageUrl) {
        await removeFromS3(imageUrl);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const s3Key = `${S3_FOLDER}${timestamp}_${path.basename(
        imageFile.originalname
      )}`;
      const fileContent = fs.readFileSync(imageFile.path);
      await uploadToS3(s3Key, fileContent, imageFile.mimetype);
      await cleanupFiles([{ localPath: imageFile.path }]);

      imageUrl = s3Key;
    }

    if (result.rowCount > 0) {
      await client.query(
        `UPDATE eSparkTalentAPI_company_data SET
           company_name = COALESCE($1, company_name),
           company_email = COALESCE($2, company_email),
           website_url = COALESCE($3, website_url),
           image = COALESCE($4, image)
         WHERE id = $5`,
        [
          company_name ?? null,
          company_email ?? null,
          website_url ?? null,
          imageUrl ?? null,
          result.rows[0].id,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO eSparkTalentAPI_company_data (company_name, company_email, website_url, image)
         VALUES ($1, $2, $3, $4)`,
        [
          company_name ?? null,
          company_email ?? null,
          website_url ?? null,
          imageUrl ?? null,
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(result.rowCount > 0 ? 200 : 201).json({
      message: `Company settings successfully ${
        result.rowCount > 0 ? "updated" : "added"
      }`,
      image: imageUrl,
    });
  } catch (err) {
    logger.error("Error in patchCompanySettings:", err);
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default patchCompanySettings;
