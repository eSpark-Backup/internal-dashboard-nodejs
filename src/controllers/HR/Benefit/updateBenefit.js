import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";


const updateBenefit = async (req, res) => {
    const { id } = req.query;
    const { card_id, description } = req.body;

    try {
        const benefit = await pool.query(
            `SELECT * FROM eSparkTalentAPI_benefits WHERE id = $1`,
            [id]
        );

        if (!benefit.rows[0]) {
            return res.status(404).json({ message: "Benefit does not exist with given id" });
        }

        const updatedBenefit = await pool.query(
            `UPDATE eSparkTalentAPI_benefits
                SET card_id      = COALESCE($2, card_id),
                    description  = COALESCE($3, description),
                    updated_at   = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, card_id, description]
        );

        if (updatedBenefit.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update benefit" });
        }

        return res.status(200).json({ message: "Benefit has been updated" });
    } catch (error) {
        logger.error(`Error updating benefit: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateBenefit;


