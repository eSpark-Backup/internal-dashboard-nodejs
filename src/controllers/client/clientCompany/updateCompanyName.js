import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateCompanyName = async (req, res) => {
  const { email } = req.user;
  const { company_name } = req.body;

  let client;

  try {

    client = await pool.connect();
    
    await client.query("BEGIN");

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [email]
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    await client.query(
      `UPDATE eSparkTalentAPI_client SET company_name = $1 WHERE email = $2`,
      [company_name, email]
    );

    await client.query(
      `UPDATE eSparkTalentAPI_end_user SET username = $1 WHERE email = $2`,
      [company_name, email]
    );

    await client.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Company name is successfully updated" });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    logger.error("Error updating company name:", error);
    return res.status(400).json({ message: error.message });
  } finally {
    if (client) client.release();
  }
};

export default updateCompanyName;
