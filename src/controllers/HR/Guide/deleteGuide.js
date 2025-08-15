import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { removeFromS3 } from "../../../helpers/s3.js";


const deleteGuide = async (req, res) => {

    const { id } = req.query;

    try {
        const guide = await pool.query(
            `SELECT * FROM eSparkTalentAPI_guide WHERE id = $1`,
            [id]
        );

        if (guide.rowCount === 0) {
            return res.status(404).json({ message: "Guide with the given ID not found" });
        }

        const { guide_doc } = guide.rows[0];

        try {
            if (guide_doc) await removeFromS3(guide_doc);
        } catch (err) {
            logger.warn(`Failed to remove guide document from S3: ${err}`);
        }


        await pool.query(
            `DELETE FROM eSparkTalentAPI_guide WHERE id = $1`,
            [id]
        );

        return res.status(200).json({ message: "Guide deleted successfully" });
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

export default deleteGuide;
