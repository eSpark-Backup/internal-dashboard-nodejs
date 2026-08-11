import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const downloadLetter = async (req, res) => {
    const { id } = req.query;

    try {
        const letter = await pool.query("SELECT * FROM eSparkTalentAPI_letter WHERE id = $1", [id]);

        if (!letter.rows[0]) {
            return res.status(404).json({ message: "Letter with this id does not exist" });
        }

        const letterDoc = letter.rows[0].letter;

        if (!letterDoc) {
            return res.status(404).json({ message: "Letter document not found" });
        }

        downloadFileFromS3(res, letterDoc, `letter.pdf`, "application/pdf");

    } catch (error) {
        logger.error(`Error getting letter document: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default downloadLetter;
