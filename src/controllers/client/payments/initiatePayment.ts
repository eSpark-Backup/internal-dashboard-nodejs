import db from "../../../config/db.js";
import payfastService from "../../../services/payfast/payfast.service.js";
import payfastConfig from "../../../config/payfast.config.js";
import { logger } from "../../../helpers/logger.js";

const initiatePayment = async (req, res) => {
  const client = await db.connect();

  try {
    const { invoiceId, invoiceType } = req.body;
    const userEmail = req.user.email;

    const clientRow = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [userEmail],
    );

    if (!clientRow.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    const clientId = clientRow.rows[0].id;

    // Validate invoice type
    if (!["SALARY", "CUSTOM"].includes(invoiceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice type. Must be SALARY or CUSTOM",
      });
    }

    await client.query("BEGIN");

    // Determine table and fetch invoice
    const tableName =
      invoiceType === "SALARY" || invoiceType === "CUSTOM"
        ? "eSparkTalentAPI_employee_invoice"
        : "eSparkTalentAPI_other_payment";

    const invoiceQuery = `
  SELECT i.*, oe.salary_currency 
  FROM ${tableName} i
  LEFT JOIN eSparkTalentAPI_outsource_employees oe ON i.employee_id = oe.employee_id
  WHERE i.id = $1 AND i.client_id = $2
`;

    const invoiceResult = await client.query(invoiceQuery, [
      invoiceId,
      clientId,
    ]);

    if (invoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Invoice not found or does not belong to you",
      });
    }

    const invoice = invoiceResult.rows[0];
    const selectedCurrency = invoice.salary_currency || "PKR"; // Fallback to PKR if null

    // Validate invoice is unpaid
    if (invoice.payment_status === "paid") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invoice has already been paid",
      });
    }

    // Validate payment is due
    if (!invoice.is_payment_due) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Payment is not due for this invoice",
      });
    }

    const amount = parseFloat(invoice.invoice_amount);

    // Generate or use existing basket_id
    let basketId = invoice.basket_id;
    if (!basketId) {
      basketId = payfastService.generateBasketId(invoiceId, invoiceType);

      // Update invoice with basket_id
      const updateBasketQuery = `
        UPDATE ${tableName}
        SET basket_id = $1
        WHERE id = $2
      `;
      await client.query(updateBasketQuery, [basketId, invoiceId]);
    } else {
      // If a basket already exists, check the latest transaction status
      const transCheck = await client.query(
        `SELECT status FROM eSparkTalentAPI_payment_transactions WHERE payfast_basket_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [basketId],
      );

      if (transCheck.rows.length > 0) {
        const lastStatus = transCheck.rows[0].status;
        // If previous attempt is still pending or failed, generate a fresh basket id
        if (lastStatus === "PENDING" || lastStatus === "FAILED") {
          const newBasketId = payfastService.generateBasketId(
            invoiceId,
            invoiceType,
          );
          basketId = newBasketId;

          const updateBasketQuery = `
            UPDATE ${tableName}
            SET basket_id = $1
            WHERE id = $2
          `;
          await client.query(updateBasketQuery, [basketId, invoiceId]);
        }
      }
    }

    // Get access token from PayFast
    const accessToken = await payfastService.getAccessToken(
      basketId,
      amount,
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
      invoiceId,
      invoiceType,
      clientId,
      amount,
      selectedCurrency,
      "PENDING",
      basketId,
    ]);

    const transactionId = transactionResult.rows[0].id;

    await client.query("COMMIT");

    // Generate invoice description
    let txnDesc = "";
    if (invoiceType === "SALARY") {
      const empQuery = `
        SELECT e.first_name, e.last_name, ei.billing_month
        FROM eSparkTalentAPI_employee_invoice ei
        JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
        WHERE ei.id = $1
      `;
      const empResult = await client.query(empQuery, [invoiceId]);
      if (empResult.rows.length > 0) {
        const emp = empResult.rows[0];
        const month = emp.billing_month
          ? new Date(emp.billing_month).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "";
        txnDesc = `Salary Invoice - ${emp.first_name} ${emp.last_name} - ${month}`;
      } else {
        txnDesc = `Salary Invoice #${invoiceId}`;
      }
    } else {
      txnDesc = `Custom Invoice #${invoiceId}`;
    }

    // Prepare PayFast form data
    const urls = payfastConfig.getUrls();
    const currentDate = new Date().toISOString().split("T")[0];

    const formData = {
      MERCHANT_ID: payfastConfig.merchantId,
      MERCHANT_NAME: payfastConfig.merchantName,
      TOKEN: accessToken,
      PROCCODE: payfastConfig.procCode,
      TXNAMT: amount.toString(),
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

    // Log payment initiation
    await payfastService.logApiCall({
      endpoint: urls.transactionUrl,
      method: "POST",
      request_payload: formData,
      basket_id: basketId,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    logger.info(`PayFast SUCCESS_URL: ${formData.SUCCESS_URL}`);
    logger.info(`PayFast FAILURE_URL: ${formData.FAILURE_URL}`);
    logger.info(`PayFast CHECKOUT_URL: ${formData.CHECKOUT_URL}`);

    logger.info(
      `Payment initiated for invoice ${invoiceId}, basket_id: ${basketId}`,
    );

    // Return form data to frontend for submission
    return res.status(200).json({
      success: true,
      message: "Payment initiation successful",
      data: {
        transactionId,
        basketId,
        amount,
        formUrl: urls.transactionUrl,
        formData,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Initiate payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export default initiatePayment;
