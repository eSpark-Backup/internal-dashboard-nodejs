import db from "../../../config/db.js";
import payfastService from "../../../services/payfast/payfast.service.js";
import { logger } from "../../../helpers/logger.js";
import {
  createPaymentSuccessNotification,
  createPaymentFailureNotification,
  createBulkPaymentNotification,
} from "../../../helpers/notifications.js";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
} from "../../../helpers/emailService.js";

const webhookHandler = async (req, res) => {
  const client = await db.connect();

  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      logger.error("PayFast webhook: empty or undefined body", {
        headers: req.headers,
      });

      return res.status(400).json({
        success: false,
        message: "Empty webhook body",
      });
    }

    let {
      transaction_id,
      err_code,
      err_msg,
      basket_id,
      validation_hash,
      PaymentName,
      transaction_amount,
      Instrument_token,
    } = req.body;

    if (Array.isArray(basket_id)) {
      basket_id = basket_id[0];
    }

    // Log incoming webhook
    await payfastService.logApiCall({
      endpoint: "/api/payfast/webhook",
      method: "POST",
      request_payload: req.body,
      basket_id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    if (typeof basket_id !== "string") {
      logger.error("Invalid basket_id format", { basket_id });
      return res
        .status(400)
        .json({ success: false, message: "Invalid basket_id" });
    }

    // Validate required parameters
    if (!basket_id || !err_code || !validation_hash) {
      logger.error("PayFast webhook missing required parameters");
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Validate hash for security
    const isValidHash = payfastService.validateHash(
      basket_id,
      err_code,
      validation_hash,
    );

    if (!isValidHash) {
      logger.error(
        `PayFast webhook hash validation failed for basket_id: ${basket_id}`,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid validation hash",
      });
    }

    await client.query("BEGIN");

    // Check if this is a bulk payment
    const bulkQuery = `
      SELECT id, client_id, invoice_ids, invoice_type, total_amount
      FROM eSparkTalentAPI_bulk_payments
      WHERE basket_id = $1
    `;
    const bulkResult = await client.query(bulkQuery, [basket_id]);

    if (bulkResult.rows.length > 0) {
      // Handle bulk payment
      await handleBulkPayment(client, bulkResult.rows[0], {
        transaction_id,
        err_code,
        err_msg,
        PaymentName,
        transaction_amount,
        Instrument_token,
        validation_hash,
      });
    } else {
      // Handle single invoice payment
      await handleSinglePayment(client, basket_id, {
        transaction_id,
        err_code,
        err_msg,
        PaymentName,
        transaction_amount,
        Instrument_token,
        validation_hash,
      });
    }

    await client.query("COMMIT");

    logger.info(
      `PayFast webhook processed successfully for basket_id: ${basket_id}`,
    );

    // Always return 200 to PayFast to acknowledge receipt
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("PayFast webhook error:", error);

    // Still return 200 to prevent PayFast retries, but log the error
    return res.status(200).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Handle single invoice payment
 */
const handleSinglePayment = async (client, basketId, paymentData) => {
  const { transaction_id, err_code, err_msg, PaymentName, Instrument_token } =
    paymentData;

  // Find invoice by basket_id (check both tables)
  let invoice = null;
  let invoiceType = null;
  let tableName = null;

  // Check employee_invoice first
  const salaryInvoiceQuery = `
    SELECT id, client_id, invoice_amount, payment_status, payment_method
    FROM eSparkTalentAPI_employee_invoice
    WHERE basket_id = $1
  `;
  const salaryResult = await client.query(salaryInvoiceQuery, [basketId]);

  if (salaryResult.rows.length > 0) {
    invoice = salaryResult.rows[0];
    invoiceType = "SALARY";
    tableName = "eSparkTalentAPI_employee_invoice";
  } else {
    // Check other_payment
    const customInvoiceQuery = `
      SELECT id, client_id, invoice_amount, payment_status, payment_method
      FROM eSparkTalentAPI_other_payment
      WHERE basket_id = $1
    `;
    const customResult = await client.query(customInvoiceQuery, [basketId]);

    if (customResult.rows.length > 0) {
      invoice = customResult.rows[0];
      invoiceType = "CUSTOM";
      tableName = "eSparkTalentAPI_other_payment";
    }
  }

  if (!invoice) {
    throw new Error(`Invoice not found for basket_id: ${basketId}`);
  }

  if (invoice.payment_method === "MANUAL") {
    logger.info(
      `Invoice ${invoice.id} is marked MANUAL - skipping PayFast webhook processing`,
    );
    return;
  }

  // Check if already paid (prevent double processing)
  if (invoice.payment_status === "paid") {
    logger.warn(
      `Invoice ${invoice.id} already marked as paid, skipping update`,
    );
    return;
  }

  const isSuccess = payfastService.isSuccessCode(err_code);

  // Update payment transaction
  const updateTransactionQuery = `
    UPDATE eSparkTalentAPI_payment_transactions
    SET 
      payfast_transaction_id = $1,
      status = $2,
      payment_method = $3,
      error_code = $4,
      error_message = $5,
      instrument_token = $6,
      validation_hash = $7,
      completed_at = NOW()
    WHERE payfast_basket_id = $8 AND invoice_id = $9
  `;

  await client.query(updateTransactionQuery, [
    transaction_id,
    isSuccess ? "SUCCESS" : "FAILED",
    PaymentName || null,
    err_code,
    isSuccess ? null : err_msg || payfastService.getErrorMessage(err_code),
    Instrument_token || null,
    paymentData.validation_hash || null,
    basketId,
    invoice.id,
  ]);

  if (isSuccess) {
    // Update invoice status to paid
    const updateInvoiceQuery = `
      UPDATE ${tableName}
      SET 
        payment_status = 'paid',
        payment_method = $1,
        payment_reference = $2,
        paid_at = NOW(),
        is_payment_due = false
      WHERE id = $3
    `;

    await client.query(updateInvoiceQuery, [
      PaymentName || "payfast",
      transaction_id,
      invoice.id,
    ]);

    // Save instrument token if provided (for future recurring payments)
    if (Instrument_token) {
      await saveInstrumentToken(
        client,
        invoice.client_id,
        Instrument_token,
        PaymentName,
      );
    }

    // Send success notification
    await createPaymentNotification(
      client,
      invoice.client_id,
      invoice.id,
      invoiceType,
      "SUCCESS",
      transaction_id,
    );

    logger.info(
      `Payment successful for invoice ${invoice.id}, transaction: ${transaction_id}`,
    );
  } else {
    // Payment failed - send failure notification
    await createPaymentNotification(
      client,
      invoice.client_id,
      invoice.id,
      invoiceType,
      "FAILED",
      null,
      err_msg,
    );

    logger.warn(
      `Payment failed for invoice ${invoice.id}, error: ${err_code} - ${err_msg}`,
    );
  }
};

/**
 * Handle bulk payment
 */
const handleBulkPayment = async (client, bulkPayment, paymentData) => {
  const { transaction_id, err_code, err_msg, PaymentName, Instrument_token } =
    paymentData;
  const { id, client_id, invoice_ids, invoice_type, total_amount } =
    bulkPayment;

  const isSuccess = payfastService.isSuccessCode(err_code);

  // Update bulk payment record
  const updateBulkQuery = `
    UPDATE eSparkTalentAPI_bulk_payments
    SET status = $1
    WHERE id = $2
  `;

  await client.query(updateBulkQuery, [isSuccess ? "SUCCESS" : "FAILED", id]);

  // Create/Update payment transaction
  const upsertTransactionQuery = `
    INSERT INTO eSparkTalentAPI_payment_transactions 
      (invoice_id, invoice_type, client_id, amount, currency, status, payfast_transaction_id, 
       payfast_basket_id, payment_method, error_code, error_message, instrument_token, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    ON CONFLICT (payfast_basket_id) 
    DO UPDATE SET
      payfast_transaction_id = EXCLUDED.payfast_transaction_id,
      status = EXCLUDED.status,
      payment_method = EXCLUDED.payment_method,
      error_code = EXCLUDED.error_code,
      error_message = EXCLUDED.error_message,
      instrument_token = EXCLUDED.instrument_token,
      completed_at = EXCLUDED.completed_at
    RETURNING id
  `;

  const transactionResult = await client.query(upsertTransactionQuery, [
    null, // No single invoice_id for bulk
    invoice_type,
    client_id,
    total_amount,
    "PKR",
    isSuccess ? "SUCCESS" : "FAILED",
    transaction_id,
    bulkPayment.basket_id,
    PaymentName || null,
    err_code,
    isSuccess ? null : err_msg || payfastService.getErrorMessage(err_code),
    Instrument_token || null,
  ]);

  const transactionRecordId = transactionResult.rows[0].id;

  // Link transaction to bulk payment
  await client.query(
    "UPDATE eSparkTalentAPI_bulk_payments SET transaction_id = $1 WHERE id = $2",
    [transactionRecordId, id],
  );

  if (isSuccess) {
    // Update all invoices in bulk payment
    const invoiceIdArray = invoice_ids;
    const tableName =
      invoice_type === "SALARY"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    for (const invoiceId of invoiceIdArray) {
      const updateInvoiceQuery = `
        UPDATE ${tableName}
        SET 
          payment_status = 'paid',
          payment_method = $1,
          payment_reference = $2,
          paid_at = NOW(),
          is_payment_due = false
        WHERE id = $3
      `;

      await client.query(updateInvoiceQuery, [
        PaymentName || "payfast",
        transaction_id,
        invoiceId,
      ]);
    }

    // Save instrument token if provided
    if (Instrument_token) {
      await saveInstrumentToken(
        client,
        client_id,
        Instrument_token,
        PaymentName,
      );
    }

    const clientQuery =
      "SELECT email FROM eSparkTalentAPI_client WHERE id = $1";
    const clientResult = await client.query(clientQuery, [client_id]);

    if (clientResult.rows.length > 0) {
      await createBulkPaymentNotification({
        clientEmail: clientResult.rows[0].email,
        hrEmail: process.env.TALENT_EMAIL,
        invoiceCount: invoice_ids.length,
        totalAmount: total_amount,
        transactionId: transaction_id,
        invoiceType: invoice_type,
      });
    }

    logger.info(
      `Bulk payment successful for ${invoiceIdArray.length} invoices, transaction: ${transaction_id}`,
    );
  } else {
    logger.warn(`Bulk payment failed, error: ${err_code} - ${err_msg}`);
  }
};

/**
 * Save instrument token for recurring payments
 */
const saveInstrumentToken = async (
  client,
  clientId,
  instrumentToken,
  paymentType,
) => {
  try {
    const query = `
      INSERT INTO eSparkTalentAPI_client_payment_methods 
        (client_id, instrument_token, payment_type, is_default, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (instrument_token) 
      DO NOTHING
    `;

    await client.query(query, [
      clientId,
      instrumentToken,
      paymentType || "account",
      false,
      true,
    ]);
  } catch (error) {
    logger.error("Failed to save instrument token:", error);
  }
};

/**
 * Create payment notification with email integration
 */
const createPaymentNotification = async (
  client,
  clientId,
  invoiceId,
  invoiceType,
  status,
  transactionId,
  errorMsg = null,
) => {
  try {
    // Get client email
    const clientQuery =
      "SELECT email, first_name, last_name FROM eSparkTalentAPI_client WHERE id = $1";
    const clientResult = await client.query(clientQuery, [clientId]);

    if (clientResult.rows.length === 0) return;

    const clientData = clientResult.rows[0];
    const clientEmail = clientData.email;
    const hrEmail = process.env.TALENT_EMAIL;

    // Get invoice details
    const tableName =
      invoiceType === "SALARY"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    let invoiceQuery = "";
    if (invoiceType === "SALARY") {
      invoiceQuery = `
        SELECT ei.invoice_amount, ei.billing_month, e.first_name, e.last_name
        FROM ${tableName} ei
        LEFT JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
        WHERE ei.id = $1
      `;
    } else {
      invoiceQuery = `
        SELECT invoice_amount, invoice_reference
        FROM ${tableName}
        WHERE id = $1
      `;
    }

    const invoiceResult = await client.query(invoiceQuery, [invoiceId]);
    if (invoiceResult.rows.length === 0) return;

    const invoice = invoiceResult.rows[0];
    const amount = invoice.invoice_amount;
    const employeeName = invoice.first_name
      ? `${invoice.first_name} ${invoice.last_name}`
      : null;
    const billingMonth = invoice.billing_month || null;

    if (status === "SUCCESS") {
      const clientEmail = clientData.email || null;
      const hrEmail = process.env.TALENT_EMAIL || null;

      // Create database notifications
      await createPaymentSuccessNotification({
        clientEmail,
        hrEmail,
        invoiceId,
        invoiceType,
        employeeName,
        amount,
        transactionId,
        billingMonth,
      });

      // Send email notifications
      await sendPaymentSuccessEmail({
        clientId: clientId,
        invoiceId,
        amount,
        transactionId,
        employeeName,
        billingMonth: billingMonth
          ? new Date(billingMonth).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "",
      });
    } else {
      const clientEmail = clientData.email || null;
      const hrEmail = process.env.TALENT_EMAIL || null;

      // Create database notifications
      await createPaymentFailureNotification({
        clientEmail,
        hrEmail,
        invoiceId,
        invoiceType,
        employeeName,
        amount,
        errorMessage: errorMsg,
        billingMonth,
      });

      // Send email notifications
      await sendPaymentFailureEmail({
        clientId: clientId,
        invoiceId,
        amount,
        errorMessage: errorMsg,
        employeeName,
        billingMonth: billingMonth
          ? new Date(billingMonth).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "",
      });
    }
  } catch (error) {
    logger.error("Failed to create payment notification:", error);
  }
};

export default webhookHandler;
