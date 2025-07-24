import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const addBenefit = async (req, res) => {

    const { card_id, employee_id, benefit, issue_date, description } = req.body || {};
    let client;

    try {
        client = await pool.connect();

        const employee = await client.query(
            `SELECT id, email FROM eSparkTalentAPI_employee WHERE email = $1 `,
            [employee_id]
        );

        if (!employee.rows[0]?.id) {
            return res.status(404).json({ message: "Employee does not exist with given employee email" });
        }

        await client.query("BEGIN");

        const userBenefit = await client.query(
            `INSERT INTO eSparkTalentAPI_benefits (card_id, employee_id, benefit, issue_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [card_id, employee.rows[0].id, benefit, issue_date, description]
        );

        if (!userBenefit.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add benefit" });
        }

        const notification = await client.query(
            `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [employee.rows[0].email, userBenefit.rows[0].id, "benefit", `${benefit} added to your account`, "added"]
        );

        if (!notification.rows[0]?.id) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Failed to add notification" });
        }

        await client.query("COMMIT");

        return res.status(200).json({ message: "One new benefit has been added", id: userBenefit.rows[0].id });

    } catch (error) {
        logger.error(`Error adding benefit: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }


}

export default addBenefit;