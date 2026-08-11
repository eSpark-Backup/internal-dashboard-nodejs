import db from "../../../config/db.js";
import payfastService from "../../../services/payfast/payfast.service.js";
import payfastConfig from "../../../config/payfast.config.js";
import { logger } from "../../../helpers/logger.js";

const bulkPayment = async (req, res) => {
  const client = await db.connect();

  try {
    const { invoiceIds, invoiceType } = req.body;
    const userEmail = req.user.email;

    const clientRow = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [userEmail],
    );

    const clientId = clientRow.rows[0].id;

    // Validate input
    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice IDs must be a non-empty array",
      });
    }

    if (!["SALARY", "CUSTOM"].includes(invoiceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice type. Must be SALARY or CUSTOM",
      });
    }

    await client.query("BEGIN");

    // Determine table name
    const tableName =
      invoiceType === "SALARY" || invoiceType === "CUSTOM"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    // Fetch all invoices
    const invoicesQuery = `
      SELECT i.id, i.invoice_amount, i.payment_status, i.is_payment_due, i.currency
      FROM ${tableName} i
      WHERE i.id = ANY($1) AND i.client_id = $2
    `;

    const invoicesResult = await client.query(invoicesQuery, [
      invoiceIds,
      clientId,
    ]);

    if (invoicesResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No valid invoices found",
      });
    }

    if (invoicesResult.rows.length !== invoiceIds.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Some invoices not found or do not belong to you",
      });
    }

    // Validate all invoices
    const invalidInvoices = invoicesResult.rows.filter(
      (inv) => inv.payment_status === "paid" || !inv.is_payment_due,
    );

    // Validate uniform currency
    const currencies = [
      ...new Set(invoicesResult.rows.map((inv) => inv.currency)),
    ];
    if (currencies.length > 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "All selected invoices must have the same currency.",
      });
    }
    const selectedCurrency = currencies[0];

    if (invalidInvoices.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Some invoices are already paid or payment is not due",
        invalidInvoiceIds: invalidInvoices.map((inv) => inv.id),
      });
    }

    // Calculate total amount
    const totalAmount = invoicesResult.rows.reduce(
      (sum, inv) => sum + parseFloat(inv.invoice_amount),
      0,
    );

    // Check for an existing bulk payment record for the same invoices and client
    const existingBulkQuery = `
      SELECT id, basket_id, status
      FROM eSparkTalentAPI_bulk_payments
      WHERE client_id = $1 AND invoice_ids = $2::jsonb AND invoice_type = $3
      ORDER BY created_at DESC LIMIT 1
    `;

    const existingBulkResult = await client.query(existingBulkQuery, [
      clientId,
      JSON.stringify(invoiceIds),
      invoiceType,
    ]);

    let basketId;
    let bulkPaymentId;

    if (existingBulkResult.rows.length > 0) {
      const existing = existingBulkResult.rows[0];
      // If previous bulk attempt is PENDING or FAILED, generate a new basket and reuse the record
      if (existing.status === "PENDING" || existing.status === "FAILED") {
        basketId = payfastService.generateBulkBasketId(clientId);
        await client.query(
          `UPDATE eSparkTalentAPI_bulk_payments SET basket_id = $1, status = 'PENDING', updated_at = NOW() WHERE id = $2`,
          [basketId, existing.id],
        );
        bulkPaymentId = existing.id;
      } else {
        // Otherwise create a fresh bulk payment record
        basketId = payfastService.generateBulkBasketId(clientId);
        const bulkPaymentQuery = `
          INSERT INTO eSparkTalentAPI_bulk_payments 
            (client_id, total_amount, invoice_ids, invoice_type, basket_id, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;

        const bulkPaymentResult = await client.query(bulkPaymentQuery, [
          clientId,
          totalAmount,
          JSON.stringify(invoiceIds),
          invoiceType,
          basketId,
          "PENDING",
        ]);

        bulkPaymentId = bulkPaymentResult.rows[0].id;
      }
    } else {
      // No existing bulk payment, create a new one
      basketId = payfastService.generateBulkBasketId(clientId);
      const bulkPaymentQuery = `
        INSERT INTO eSparkTalentAPI_bulk_payments 
          (client_id, total_amount, invoice_ids, invoice_type, basket_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const bulkPaymentResult = await client.query(bulkPaymentQuery, [
        clientId,
        totalAmount,
        JSON.stringify(invoiceIds),
        invoiceType,
        basketId,
        "PENDING",
      ]);

      bulkPaymentId = bulkPaymentResult.rows[0].id;
    }

    // Get access token from PayFast
    const accessToken = await payfastService.getAccessToken(
      basketId,
      totalAmount.toFixed(2),
      selectedCurrency,
    );

    // Get client details
    const clientQuery = `
      SELECT email, phone_number, first_name, last_name, company_name, country, address
      FROM eSparkTalentAPI_client
      WHERE id = $1
    `;
    const clientResult = await client.query(clientQuery, [clientId]);
    const clientData = clientResult.rows[0];

    // Create payment transaction record
    const transactionQuery = `
      INSERT INTO eSparkTalentAPI_payment_transactions 
        (invoice_id, invoice_type, client_id, amount, currency, status, payfast_basket_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (payfast_basket_id) DO UPDATE SET
        invoice_id = EXCLUDED.invoice_id,
        invoice_type = EXCLUDED.invoice_type,
        client_id = EXCLUDED.client_id,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        updated_at = NOW(),
        payfast_transaction_id = NULL,
        error_code = NULL,
        error_message = NULL,
        completed_at = NULL
      RETURNING id
    `;

    const transactionResult = await client.query(transactionQuery, [
      null, // No single invoice_id for bulk payment
      invoiceType,
      clientId,
      totalAmount,
      selectedCurrency,
      "PENDING",
      basketId,
    ]);

    const transactionId = transactionResult.rows[0].id;

    // Link transaction to bulk payment
    await client.query(
      "UPDATE eSparkTalentAPI_bulk_payments SET transaction_id = $1 WHERE id = $2",
      [transactionId, bulkPaymentId],
    );

    await client.query("COMMIT");

    // Generate transaction description
    const txnDesc = `Bulk Payment - ${invoiceIds.length} ${invoiceType === "SALARY" ? "Salary" : "Custom"} Invoice${invoiceIds.length > 1 ? "s" : ""}`;

    // Prepare PayFast form data
    const urls = payfastConfig.getUrls();
    const currentDate = new Date().toISOString().split("T")[0];

    const formData = {
      MERCHANT_ID: payfastConfig.merchantId,
      MERCHANT_NAME: payfastConfig.merchantName,
      TOKEN: accessToken,
      PROCCODE: payfastConfig.procCode,
      TXNAMT: totalAmount.toFixed(2),
      CUSTOMER_MOBILE_NO: clientData.phone_number || "",
      CUSTOMER_EMAIL_ADDRESS: clientData.email,
      SIGNATURE: `${basketId}-${Date.now()}`,
      VERSION: payfastConfig.version,
      TXNDESC: txnDesc,
      SUCCESS_URL: `${payfastConfig.successUrl}?basket_id=${basketId}`,
      FAILURE_URL: `${payfastConfig.failureUrl}?basket_id=${basketId}`,
      BASKET_ID: basketId,
      ORDER_DATE: currentDate,
      CHECKOUT_URL: payfastConfig.checkoutUrl,
      CURRENCY_CODE: selectedCurrency,
      TRAN_TYPE: payfastConfig.tranType,
      CUSTOMER_NAME: `${clientData.first_name} ${clientData.last_name}`,
      MERCHANT_CUSTOMER_ID: clientId.toString(),
      COUNTRY: clientData.country || "Pakistan",
      BILLING_CUSTOMER_NAME: `${clientData.first_name} ${clientData.last_name}`,
      BILLING_ADDRESS_1: clientData.address || "",
      BILLING_ADDRESS_CITY: clientData.country || "",
      MERCHANT_USERAGENT: req.headers["user-agent"] || "eSpark-HRMS/1.0",
    };

    // Log bulk payment initiation
    await payfastService.logApiCall({
      endpoint: urls.transactionUrl,
      method: "POST",
      request_payload: {
        ...formData,
        bulkPaymentId,
        invoiceCount: invoiceIds.length,
      },
      basket_id: basketId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    logger.info(
      `Bulk payment initiated for ${invoiceIds.length} invoices, basket_id: ${basketId}`,
    );

    // Return form data to frontend
    return res.status(200).json({
      success: true,
      message: "Bulk payment initiation successful",
      data: {
        bulkPaymentId,
        transactionId,
        basketId,
        totalAmount,
        invoiceCount: invoiceIds.length,
        formUrl: urls.transactionUrl,
        formData,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Bulk payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to initiate bulk payment",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export default bulkPayment;
