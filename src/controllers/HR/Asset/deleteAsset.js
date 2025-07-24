import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const deleteAsset = async (req, res) => {
  const { id } = req.query || {};
  
  let client;

  try {

    client = await pool.connect();


    const result = await client.query(
      `SELECT * FROM esparktalentapi_asset WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }
    
    logger.info(`Deleting asset with id ${id}`);
    await client.query(`DELETE FROM esparktalentapi_asset WHERE id = $1`, [id]);

    logger.info(`Asset with id ${id} deleted successfully`);

    return res.status(200).json({ message: "Asset has been deleted" });
  } catch (err) {
    logger.error("Delete asset error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default deleteAsset;
