import pool from "../../../config/db.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import { logger } from "../../../helpers/logger.js";

const TALENT_EMAIL = process.env.TALENT_EMAIL;

const getEmployees = async (req, res) => {
  try {
    logger.info("Fetching talent ID using TALENT_EMAIL...");

    // Step 1: Get ID of the TALENT_EMAIL to exclude from JOIN
    const talentUserRes = await pool.query(
      "SELECT id FROM eSparkTalentAPI_client WHERE email = $1",
      [TALENT_EMAIL]
    );

    if (talentUserRes.rows.length === 0) {
      logger.error(`TALENT_EMAIL (${TALENT_EMAIL}) not found in clients table`);
      return res.status(404).json({ message: "Client not found" });
    }

    const talentId = talentUserRes.rows[0].id;
    logger.info(`Found talent client ID: ${talentId}`);

    // Step 2: Main query with JOINs
    const result = await pool.query(
      `
      SELECT 
        emp.id,
        emp.employee_id,
        emp.first_name,
        emp.last_name,
        emp.image,
        emp.job_title,
        emp.company AS default_company,
        out.client_id,
        client.company_name
      FROM eSparkTalentAPI_employee AS emp
      LEFT JOIN eSparkTalentAPI_outsource_employees AS out
        ON emp.id = out.employee_id AND out.client_id != $1
      LEFT JOIN eSparkTalentAPI_client AS client
        ON out.client_id = client.id
    `,
      [talentId]
    );
    logger.info(
      `Mapping ${result.rows.length} employees with signed image URLs...`
    );

    // Step 3: Add signed S3 URLs
    const records = await Promise.all(
      result.rows.map(async (row) => {
        const fullName = `${row.first_name} ${row.last_name}`;

        let signedImageUrl = null;
        if (row.image) {
          try {
            signedImageUrl = await getSignedUrl(row.image);
          } catch (err) {
            logger.error(
              `Signed URL error for image ${row.image}: ${err.message}`
            );
          }
        }

        return {
          id: row.id,
          employee_id: row.employee_id,
          name: fullName,
          image_path: signedImageUrl,
          designation: row.job_title,
          company: row.company_name || row.default_company,
          active: !!row.client_id,
        };
      })
    );

    logger.info("Returning employee records to client");

    return res.status(200).json(records);
  } catch (err) {
    logger.error(`Error in getHrEmployees: ${err.message}`);

    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getEmployees;
