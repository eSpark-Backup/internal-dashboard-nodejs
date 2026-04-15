import pool from "../../../config/db.js";
import { createNotification } from "../../../helpers/notifications.js";
import { logger } from "../../../helpers/logger.js";

const manualPaymentReview = async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body || {};

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceQuery = `
      SELECT id, client_id, payment_status, payment_method, 'employee_invoice' AS type
      FROM eSparkTalentAPI_employee_invoice
      WHERE id = $1
      UNION ALL
      SELECT id, client_id, payment_status, payment_method, 'other_payment' AS type
      FROM eSparkTalentAPI_other_payment
      WHERE id = $1
    `;

    const invoiceResult = await client.query(invoiceQuery, [id]);

    if (invoiceResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoiceResult.rowCount > 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Invoice ID is ambiguous across invoice types",
      });
    }

    const invoice = invoiceResult.rows[0];

    if (action === "approve" && invoice.payment_status === "paid") {
      await client.query("COMMIT");
      return res.status(200).json({
        message: "Manual payment was already approved",
        invoice_id: id,
      });
    }

    if (invoice.payment_status !== "under_review") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Only invoices under review can be approved or rejected",
      });
    }

    const tableName =
      invoice.type === "employee_invoice"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    let updateQuery = "";
    let updateParams = [];
    let clientNotification = null;

    if (action === "approve") {
      updateQuery = `
        UPDATE ${tableName}
        SET payment_status = 'paid',
            paid_at = NOW(),
            is_payment_due = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      updateParams = [id];
      clientNotification = {
        email: null,
        refId: id,
        notificationType: "manual_payment_approved",
        description: `Your manual payment for invoice #${id} has been approved and marked as paid.`,
        status: "pending",
      };
    } else if (action === "reject") {
      updateQuery = `
        UPDATE ${tableName}
        SET payment_status = 'pending',
            payment_method = NULL,
            payment_reference = NULL,
            is_payment_due = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      updateParams = [id];
      clientNotification = {
        email: null,
        refId: id,
        notificationType: "manual_payment_rejected",
        description: `Your manual payment for invoice #${id} was rejected.${
          reason ? ` Reason: ${reason}` : ""
        }`,
        status: "pending",
      };
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid action" });
    }

    const updatedInvoice = await client.query(updateQuery, updateParams);
    if (updatedInvoice.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Failed to update invoice payment review status" });
    }

    const clientResult = await client.query(
      "SELECT email FROM eSparkTalentAPI_client WHERE id = $1 LIMIT 1",
      [invoice.client_id],
    );

    const clientEmail = clientResult.rows[0]?.email;
    if (clientEmail) {
      clientNotification.email = clientEmail;
      await createNotification(clientNotification);
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message:
        action === "approve"
          ? "Manual payment approved successfully"
          : "Manual payment rejected successfully",
      invoice_id: id,
      status: action === "approve" ? "paid" : "pending",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`Error reviewing manual payment: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export default manualPaymentReview;
