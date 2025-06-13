import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";

const deleteOffshoreContract = async (req, res) => {
  const { id } = req.query;

  let client;
  try {
    client = await pool.connect();

    const contractRes = await client.query(
      `SELECT id, contract_doc, employee_id, client_id 
       FROM eSparkTalentAPI_offshore_contracts 
       WHERE id = $1`,
      [id]
    );

    if (contractRes.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Offshore contract with the given ID not found" });
    }

    const { contract_doc, employee_id, client_id } = contractRes.rows[0];

    await client.query("BEGIN");

    const deleteContractRes = await client.query(
      `DELETE FROM eSparkTalentAPI_offshore_contracts 
       WHERE id = $1 RETURNING id`,
      [id]
    );

    if (!deleteContractRes.rows[0]?.id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Failed to delete contract" });
    }

    await client.query(
      `DELETE FROM eSparkTalentAPI_notifications 
       WHERE email = (
         SELECT email FROM eSparkTalentAPI_client WHERE id = $1
       ) AND ref_id = $2 AND notification_type = 'offshore_contracts'`,
      [client_id, id]
    );

    await client.query(
      `DELETE FROM eSparkTalentAPI_notifications 
       WHERE email = (
         SELECT email FROM eSparkTalentAPI_employee WHERE id = $1
       ) AND ref_id = $2 AND notification_type = 'offshore_contracts'`,
      [employee_id, id]
    );

    try {
      if (contract_doc) await removeFromS3(contract_doc);
    } catch (err) {
      logger.warn(
        `Failed to remove offshore contract document from S3: ${err}`
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "One contract has been removed from offshore contracts",
    });
  } catch (error) {
    logger.error(error);
    if (client) await client.query("ROLLBACK");
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default deleteOffshoreContract;
