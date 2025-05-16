import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

export const deleteLetter = async (req, res) => {
  try {
    const id = req.query.id;

    const deleteRes = await pool.query(
      `DELETE FROM esparktalentapi_letter WHERE id = $1`,
      [id]
    );

    if (deleteRes.rowCount === 0) {
      logger.warn(`Delete failed — no letter found with ID: ${id}`);
      return res.status(404).json({ message: "Letter not found" });
    }

    logger.info(`Letter with ID ${id} deleted successfully.`);
    return res.status(200).json({ message: "Letter deleted successfully" });
  } catch (err) {
    logger.error("Delete letter error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
