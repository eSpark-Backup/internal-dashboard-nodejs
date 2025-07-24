import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateInvoicePaymentStatus = async (req, res) => {

    const talentEmail = process.env.TALENT_EMAIL;

    const { id } = req.query || {};
    const { payment_status, category } = req.body || {};

    let client;

    switch (category) {
        case "employee_invoice":
            try {
                client = await pool.connect();


                const employeeInvoice = await client.query(
                    `SELECT id FROM eSparkTalentAPI_employee_invoice WHERE id = $1`,
                    [id]
                );

                if (!employeeInvoice.rows[0]?.id) {
                    return res.status(404).json({ message: "Employee invoice does not exist with given id" });
                }

                await client.query("BEGIN");

                const updateEmployeeInvoice = await client.query(
                    `UPDATE 
                        eSparkTalentAPI_employee_invoice 
                        SET 
                        payment_status = COALESCE($1, payment_status),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2 RETURNING id`,
                    [payment_status, id]
                );

                if (!updateEmployeeInvoice.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to update employee invoice" });
                }


                const notification = await client.query(
                    `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [talentEmail, id, "employee_invoice", `employee invoice has been ${payment_status}`, payment_status]
                );

                if (!notification.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to add notification" });
                }

                await client.query("COMMIT");

                return res.status(200).json({ message: "Employee invoice has been updated", id: updateEmployeeInvoice.rows[0].id });

            } catch (error) {
                logger.error(`Error updating invoice payment status: ${error}`);
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        case "other_payment":
            try {
                client = await pool.connect();


                const otherPayment = await client.query(
                    `SELECT id FROM eSparkTalentAPI_other_payment WHERE id = $1`,
                    [id]
                );

                if (!otherPayment.rows[0]?.id) {
                    return res.status(404).json({ message: "Other payment does not exist with given id" });
                }

                await client.query("BEGIN");

                const updateOtherPayment = await client.query(
                    `UPDATE 
                        eSparkTalentAPI_other_payment 
                        SET 
                        payment_status = COALESCE($1, payment_status),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2 RETURNING id`,
                    [payment_status, id]
                );

                if (!updateOtherPayment.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to update other payment" });
                }


                const notification = await client.query(
                    `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [talentEmail, id, "other_payment", `other payment has been ${payment_status}`, payment_status]
                );

                if (!notification.rows[0]?.id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ message: "Failed to add notification" });
                }

                await client.query("COMMIT");

                return res.status(200).json({ message: "Other payment has been updated", id: updateOtherPayment.rows[0].id });

            } catch (error) {
                logger.error(`Error updating invoice payment status: ${error}`);
                return res.status(500).json({ message: "Internal server error" });
            } finally {
                if (client) client.release();
            }
        default:
            return res.status(400).json({ message: "Invalid category" });
    }




}

export default updateInvoicePaymentStatus;