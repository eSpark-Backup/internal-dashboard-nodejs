import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";

const getCompanySettings = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT id, company_name, company_email, website_url, image
      FROM eSparkTalentAPI_company_data
      LIMIT 1
    `);

    if (result.rowCount === 0) {
      return res.status(200).send([]);
    }

    const company = result.rows[0];

    const imageUrl = company?.image
      ? await getSignedUrl(company?.image)
      : null;

    return res.status(200).json({
      id: company?.id,
      company_name: company?.company_name,
      company_email: company?.company_email,
      website_url: company?.website_url,
      image: imageUrl,
    });
  } catch (err) {
    logger.error("Error in getCompanySettings:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getCompanySettings;
