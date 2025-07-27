import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const downloadGuide = async (req, res) => {
    const { id } = req.query;

    try {
        const guide = await pool.query("SELECT * FROM eSparkTalentAPI_guide WHERE id = $1", [id]);

        if (!guide.rows[0]) {
            return res.status(404).json({ message: "Guide with this id does not exist" });
        }

        const guideDoc = guide.rows[0].guide_doc;

        if (!guideDoc) {
            return res.status(404).json({ message: "Guide document not found" });
        }

        downloadFileFromS3(res, guideDoc, `guide.pdf`, "application/pdf");

    } catch (error) {
        logger.error(`Error getting guide document: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default downloadGuide;
