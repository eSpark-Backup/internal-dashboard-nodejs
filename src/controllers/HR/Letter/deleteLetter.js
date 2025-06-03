import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const deleteLetter = async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    await client.query("BEGIN");
    const id = req.query.id;

    const letterRes = await client.query(
      `DELETE FROM esparktalentapi_letter WHERE id = $1`,
      [id]
    );

    if (letterRes.rowCount === 0) {
      await client.query("ROLLBACK");
      logger.warn(`Delete failed — no letter found with ID: ${id}`);
      return res.status(404).json({ message: "Letter not found" });
    }

    await client.query(
      `DELETE FROM eSparkTalentAPI_notifications WHERE ref_id = $1 AND notification_type = 'letter'`,
      [id]
    );
    await client.query("COMMIT");

    logger.info(`Letter with ID ${id} deleted successfully.`);
    return res.status(200).json({ message: "Letter deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(`Delete letter error: ${err}`);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default deleteLetter;
