import pool from "../../../config/db.js";
import { createNotification } from "../../../helpers/notifications.js";
import { logger } from "../../../helpers/logger.js";

const manualPayment = async (req, res) => {
  const email = req.user?.email;
  const { id } = req.params;
  const { payment_reference } = req.body || {};

  if (!email) {
    return res
      .status(401)
      .json({ message: "Missing authenticated user email" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const clientResult = await client.query(
      "SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1",
      [email],
    );

    if (clientResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const clientId = clientResult.rows[0].id;

    const invoiceQuery = `
      SELECT id, payment_status, is_payment_due, payment_method, 'employee_invoice' AS type
      FROM eSparkTalentAPI_employee_invoice
      WHERE id = $1 AND client_id = $2
      UNION ALL
      SELECT id, payment_status, is_payment_due, payment_method, 'other_payment' AS type
      FROM eSparkTalentAPI_other_payment
      WHERE id = $1 AND client_id = $2
      LIMIT 1
    `;

    const invoiceResult = await client.query(invoiceQuery, [id, clientId]);

    if (invoiceResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoiceResult.rows[0];

    if (invoice.payment_status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Only pending invoices can be submitted for manual payment review",
      });
    }

    if (invoice.is_payment_due !== true) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Invoice is not currently available for payment" });
    }

    if (invoice.payment_method === "MANUAL") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "A manual payment request is already under review for this invoice",
      });
    }

    const tableName =
      invoice.type === "employee_invoice"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    const updateResult = await client.query(
      `
        UPDATE ${tableName}
        SET payment_status = 'under_review',
            payment_method = 'MANUAL',
            payment_reference = COALESCE($1, payment_reference),
            is_payment_due = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `,
      [payment_reference || null, id],
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Failed to submit manual payment request" });
    }

    const hrEmail = process.env.TALENT_EMAIL || "talent@esparkconsultants.com";
    await createNotification({
      email: hrEmail,
      refId: id,
      notificationType: "manual_payment_request",
      description: `Client has submitted a manual payment request for invoice #${id}. Please review and confirm.`,
      status: "pending",
    });

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Manual payment request submitted for review",
      invoice_id: id,
      payment_status: "under_review",
      payment_reference: payment_reference || null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`Error submitting manual payment request: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export default manualPayment;
