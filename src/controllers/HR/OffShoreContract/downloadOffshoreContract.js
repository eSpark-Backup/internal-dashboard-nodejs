import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";

const downloadOffshoreContract = async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      "SELECT contract_doc FROM eSparkTalentAPI_offshore_contracts WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Offshore contract not found" });
    }

    const contractDoc = result.rows[0].contract_doc;

    if (!contractDoc) {
      return res.status(404).json({ message: "Contract document not found" });
    }

    return downloadFileFromS3(
      res,
      contractDoc,
      "offshore_contract.pdf",
      "application/pdf"
    );
  } catch (error) {
    logger.error("Error downloading offshore contract:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default downloadOffshoreContract;
