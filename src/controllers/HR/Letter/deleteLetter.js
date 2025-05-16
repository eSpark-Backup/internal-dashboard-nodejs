import pool from "../../../config/db.js";

export const deleteLetter = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.query.id, 10);

    if (isNaN(id)) {
      logger.warn(`Invalid ID provided for deletion: ${req.query.id}`);
      return res.status(400).json({ id: ["Invalid ID"] });
    }

    await client.query("BEGIN");

    const deleteRes = await client.query(
      `DELETE FROM esparktalentapi_letter WHERE id = $1`,
      [id]
    );

    if (deleteRes.rowCount === 0) {
      logger.warn(`Delete failed — no letter found with ID: ${id}`);
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Letter not found" });
    }

    await client.query("COMMIT");
    logger.info(`Letter with ID ${id} deleted successfully.`);
    return res.status(200).json({ message: "Letter deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Delete letter error:", err);
    console.error("Delete letter error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
