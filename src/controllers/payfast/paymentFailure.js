import db from "../../config/db.js";
import { logger } from "../../helpers/logger.js";
import payfastService from "../../services/payfast/payfast.service.js";
import { createPaymentFailureNotification } from "../../helpers/notifications.js";
import { sendPaymentFailureEmail } from "../../helpers/emailService.js";

/**
 * Handle PayFast payment failure redirect
 * This endpoint is called when PayFast redirects users after failed payment
 */
const handlePaymentFailure = async (req, res) => {
  const isDev = !(
    process.env.NODE_ENV === "production" || process.env.ENV === "prod"
  );

  if (isDev) {
    logger.info("Redirect URL:", req.originalUrl);
    logger.info("Redirect method:", req.method);
    logger.info("Query:", req.query);
    logger.info("Body:", req.body);
  }

  try {
    const data = req.method === "GET" ? req.query : req.body;

    let { basket_id, transaction_id, err_code, err_msg, transaction_amount } =
      data;

    if (Array.isArray(basket_id)) {
      basket_id = basket_id[0];
    }

    if (isDev) {
      logger.info("RAW PayFast payload", JSON.stringify(data, null, 2));
    }

    // Log the failure redirect
    if (isDev) {
      logger.error("PayFast failure redirect received", {
        basket_id,
        transaction_id,
        err_code,
        err_msg,
        transaction_amount,
      });
    }

    // Validate required parameters
    if (!basket_id) {
      logger.error("PayFast failure redirect missing basket_id", req.query);
      return res.status(400).send(`
        <html>
          <head><title>Payment Error</title></head>
          <body>
            <h1>Payment Error</h1>
            <p>Missing payment reference information. Please contact support.</p>
          </body>
        </html>
      `);
    }

    // Check if payment transaction exists and update status
    const transactionQuery = `
      SELECT pt.*, c.email as client_email, c.first_name, c.last_name, c.company_name
      FROM eSparkTalentAPI_payment_transactions pt
      JOIN eSparkTalentAPI_client c ON pt.client_id = c.id
      WHERE pt.payfast_basket_id = $1
    `;

    const transactionResult = await db.query(transactionQuery, [basket_id]);
    if (isDev) {
      logger.info("Transaction query result", transactionResult.rows);
    }

    if (transactionResult.rows.length === 0) {
      logger.error(
        `PayFast failure: Transaction not found for basket_id: ${basket_id}`,
      );
      return res.status(404).send(`
        <html>
          <head><title>Payment Not Found</title></head>
          <body>
            <h1>Payment Not Found</h1>
            <p>The payment transaction could not be found. Please contact support.</p>
            <p>Reference: ${basket_id}</p>
          </body>
        </html>
      `);
    }

    const transaction = transactionResult.rows[0];

    // Update transaction status if not already failed
    if (transaction.status !== "FAILED") {
      const updateQuery = `
        UPDATE eSparkTalentAPI_payment_transactions
        SET
          status = 'FAILED',
          payfast_transaction_id = $1,
          error_code = $2,
          error_message = $3,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE payfast_basket_id = $4
        RETURNING *
      `;

      await db.query(updateQuery, [
        transaction_id || null,
        err_code || "UNKNOWN",
        err_msg || payfastService.getErrorMessage(err_code) || "Payment failed",
        basket_id,
      ]);

      // Send failure notification and email
      try {
        const clientEmail = transaction.client_email || null;
        const hrEmail = null; // optionally fetch HR email if available
        const notificationErrorMessage =
          err_msg ||
          payfastService.getErrorMessage(err_code) ||
          "Payment failed";

        await createPaymentFailureNotification({
          clientEmail,
          hrEmail,
          invoiceId: transaction.invoice_id,
          invoiceType: transaction.invoice_type,
          employeeName: `${transaction.first_name} ${transaction.last_name}`,
          amount: transaction.amount,
          errorMessage: notificationErrorMessage,
          billingMonth: transaction.billing_month || null,
        });

        await sendPaymentFailureEmail({
          clientId: transaction.client_id,
          invoiceId: transaction.invoice_id,
          amount: transaction.amount,
          errorMessage: notificationErrorMessage,
          employeeName: `${transaction.first_name} ${transaction.last_name}`,
          billingMonth: transaction.billing_month || "N/A",
        });
      } catch (notificationError) {
        logger.error(
          "Failed to send payment failure notifications:",
          notificationError,
        );
      }
    }

    // Get user-friendly error message
    const errorMessage =
      err_msg ||
      payfastService.getErrorMessage(err_code) ||
      "Payment was declined";

    // Return failure page with retry option
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
          }
          .failure-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .failure-icon {
            color: #dc3545;
            font-size: 48px;
            margin-bottom: 20px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #dc3545;
            margin: 20px 0;
          }
          .error-details {
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
            border: 1px solid #f5c6cb;
          }
        </style>
      </head>
      <body>
        <div class="failure-container">
          <div class="failure-icon">✗</div>
          <h1>Payment Failed</h1>
          <div class="amount">PKR ${transaction.amount.toLocaleString()}</div>

          <div class="error-details">
            <h3>Payment Error</h3>
            <p><strong>Reference:</strong> ${basket_id}</p>
            <p><strong>Error:</strong> ${errorMessage}</p>
            ${err_code ? `<p><strong>Error Code:</strong> ${err_code}</p>` : ""}
            ${transaction_id ? `<p><strong>Transaction ID:</strong> ${transaction_id}</p>` : ""}
          </div>

          <p>Unfortunately, your payment could not be processed at this time.</p>

          <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
            If you continue to experience issues, please contact our support team with the reference number above.
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("PayFast failure handler error", {
      message: error.message,
      stack: error.stack,
      payload: req.method === "GET" ? req.query : req.body,
    });

    res.status(500).send(`
  <html>
    <body>
      <h1>Payment Processing Error</h1>
      <pre>${error.message}</pre>
      <pre>${error.stack}</pre>
    </body>
  </html>
`);
  }
};

export { handlePaymentFailure };
