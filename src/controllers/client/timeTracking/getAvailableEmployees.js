import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getAvailableEmployees = async (req, res) => {
    const { email } = req.user;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "Client not found" });
        }

        const clientId = clientResult.rows[0].id;

        const result = await pool.query(`
            SELECT 
            e.email as employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS name
            FROM eSparkTalentAPI_outsource_employees AS oe
            LEFT JOIN eSparkTalentAPI_employee AS e
                ON oe.employee_id = e.id
            WHERE oe.client_id = $1 AND oe.status = 'active'
        `, [clientId]);

        return res.status(200).json({ employees: result.rows });

    } catch (err) {
        logger.error(`Error fetching available employees: ${err.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export default getAvailableEmployees;
