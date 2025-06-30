import pool from "../../../config/db.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import { logger } from "../../../helpers/logger.js";

const getClientProfile = async (req, res) => {
  const { id } = req.query;

  try {

    const result = await pool.query(
      `SELECT id, client_id, first_name, last_name, company_name, 
          phone_number, email, country, image, address, 
          TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date
   FROM eSparkTalentAPI_client 
   WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const clientData = result.rows[0];

    let imageUrl = null;
    if (clientData.image) {
      try {
        imageUrl = await getSignedUrl(clientData.image);
      } catch (err) {
        logger.warn("Failed to generate signed URL:", err.message);
        imageUrl = null;
      }
    }

    const responseData = {
      id: clientData.id,
      client_id: clientData.client_id,
      first_name: clientData.first_name,
      last_name: clientData.last_name,
      company_name: clientData.company_name,
      phone_number: clientData.phone_number,
      email: clientData.email,
      country: clientData.country,
      image_path: imageUrl,
      address: clientData.address,
      join_date: clientData.join_date,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    logger.error("Get client profile failed:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default getClientProfile;
