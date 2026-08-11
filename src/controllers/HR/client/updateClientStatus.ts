import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";


const updateClientStatus = async (req, res) => {
    const { id } = req.query;
    const { is_active } = req.body

    try {
        const clientResult = await pool.query(
            `SELECT email, first_name, last_name FROM eSparkTalentAPI_client WHERE id = $1`,
            [id]
        );

        if (!clientResult.rows.length) {
            return res.status(404).json({ message: "Client with this ID not found" });
        }

        const userResult = await pool.query(
            `SELECT email FROM eSparkTalentAPI_end_user WHERE email = $1`,
            [clientResult.rows[0].email]
        );

        if (!userResult.rows.length) {
            return res.status(404).json({ message: "User with client's email not found" });
        }

        const userUpdateResult = await pool.query(
            `UPDATE eSparkTalentAPI_end_user SET is_active = $1 WHERE email = $2 `,
            [is_active, userResult.rows[0].email]
        );

        if (!userUpdateResult.rowCount) {
            return res.status(400).json({ message: "Failed to update user status" });
        }


        return res.status(200).json({ message: `${clientResult.rows[0]?.first_name} ${clientResult.rows[0]?.last_name} is set to ${is_active ? "active" : "inactive"}` });
    } catch (error) {
        logger.error(`Error updating client status: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
}



export default updateClientStatus;