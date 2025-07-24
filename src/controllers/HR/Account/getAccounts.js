import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import { decrypt } from "../../../helpers/utils.js";

const getAccounts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, account_name, email, image, password FROM eSparkTalentAPI_account_n_persmission"
    );

    const accounts = await Promise.all(
      result.rows.map(async (row) => {
        let signedImageUrl = null;
        let decryptedPassword = null;
        
        if (row.image) {
          try {
            signedImageUrl = await getSignedUrl(row.image);
          } catch (error) {
            logger.error(`Failed to get signed URL for image ${row.image}: ${error}`);
          }
        }
        
        try {
          decryptedPassword = row.password ? decrypt(row.password) : null;
        } catch (error) {
          logger.error(`Failed to decrypt password for account ${row.id}: ${error}`);
        }

        return {
          ...row,
          image: signedImageUrl,
          password: decryptedPassword,
        };
      })
    );

    return res.status(200).json(accounts);
  } catch (err) {
    logger.error(`Error fetching accounts: ${err}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default getAccounts;