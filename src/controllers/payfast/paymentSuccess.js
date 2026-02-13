import db from "../../config/db.js";
import { logger } from "../../helpers/logger.js";
import { createPaymentSuccessNotification } from "../../helpers/notifications.js";
import { sendPaymentSuccessEmail } from "../../helpers/emailService.js";

/**
 * Handle PayFast payment success redirect
 * This endpoint is called when PayFast redirects users after successful payment
 */
const handlePaymentSuccess = async (req, res) => {
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
    const { transaction_id, err_code, err_msg, transaction_amount } = data;

    const basketId = Array.isArray(data.basket_id)
      ? data.basket_id[0]
      : data.basket_id;

    if (isDev) {
      logger.info("PayFast success redirect payload", data);
    }

    // Log the success redirect
    if (isDev) {
      logger.info("PayFast success redirect received", {
        basketId,
        transaction_id,
        err_code,
        transaction_amount,
      });
    }

    // Validate required parameters
    if (!basketId || !transaction_id) {
      logger.error(
        "PayFast success redirect missing required parameters",
        req.query,
      );
      return res.status(400).send(`
        <html>
          <head><title>Payment Error</title></head>
          <body>
            <h1>Payment Error</h1>
            <p>Missing required payment information. Please contact support.</p>
            <p>Reference: ${basketId || "N/A"}</p>
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

    const transactionResult = await db.query(transactionQuery, [basketId]);

    if (transactionResult.rows.length === 0) {
      logger.error(
        `PayFast success: Transaction not found for basket_id: ${basketId}`,
      );
      return res.status(404).send(`
        <html>
          <head><title>Payment Not Found</title></head>
          <body>
            <h1>Payment Not Found</h1>
            <p>The payment transaction could not be found. Please contact support.</p>
            <p>Reference: ${basketId}</p>
          </body>
        </html>
      `);
    }

    const transaction = transactionResult.rows[0];

    // Update transaction status if not already completed
    if (transaction.status !== "SUCCESS") {
      const updateQuery = `
        UPDATE eSparkTalentAPI_payment_transactions
        SET
          status = 'SUCCESS',
          payfast_transaction_id = $1,
          error_code = $2,
          error_message = $3,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE payfast_basket_id = $4
        RETURNING *
      `;

      await db.query(updateQuery, [
        transaction_id,
        err_code || "000",
        err_msg || "Payment successful",
        basketId,
      ]);

      // Update invoice status based on transaction type
      if (transaction.invoice_type === "SALARY") {
        await db.query(
          `
          UPDATE eSparkTalentAPI_employee_invoice
          SET
            is_payment_due = false,
            payment_method = 'PAYFAST',
            payment_reference = $1,
            paid_at = NOW()
          WHERE basket_id = $2
        `,
          [transaction_id, basketId],
        );
      } else if (transaction.invoice_type === "CUSTOM") {
        await db.query(
          `
          UPDATE eSparkTalentAPI_other_payment
          SET
            is_payment_due = false,
            payment_method = 'PAYFAST',
            payment_reference = $1,
            paid_at = NOW()
          WHERE basket_id = $2
        `,
          [transaction_id, basketId],
        );
      }

      // Send success notification and email
      try {
        const clientEmail = transaction.client_email || null;
        const hrEmail = process.env.TALENT_EMAIL || null;

        await createPaymentSuccessNotification({
          clientEmail,
          hrEmail,
          invoiceId: transaction.invoice_id,
          invoiceType: transaction.invoice_type,
          employeeName: `${transaction.first_name} ${transaction.last_name}`,
          amount: transaction.amount,
          transactionId: transaction_id,
          billingMonth: transaction.billing_month || null,
        });

        await sendPaymentSuccessEmail({
          clientId: transaction.client_id,
          invoiceId: transaction.invoice_id,
          amount: transaction.amount,
          transactionId: transaction_id,
          employeeName: `${transaction.first_name} ${transaction.last_name}`,
          billingMonth: transaction.billing_month || "N/A",
        });
      } catch (notificationError) {
        logger.error(
          "Failed to send payment success notifications:",
          notificationError,
        );
        // Don't fail the payment for notification errors
      }
    }

    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
          }
          .success-container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success-icon {
            color: #28a745;
            font-size: 48px;
            margin-bottom: 20px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            margin: 20px 0;
          }
          .details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="success-container">
          <div class="success-icon">✓</div>
          <h1>Payment Successful!</h1>
          <div class="amount">PKR ${transaction.amount.toLocaleString()}</div>
          <div class="details">
            <p><strong>Transaction ID:</strong> ${transaction_id}</p>
            <p><strong>Reference:</strong> ${basketId}</p>
            <p><strong>Amount:</strong> PKR ${transaction.amount.toLocaleString()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>Your payment has been processed successfully.</p>
          <p>You will receive a confirmation email shortly.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("PayFast success handler error:", error);

    res.status(500).send(`
      <html>
        <head><title>Payment Processing Error</title></head>
        <body>
          <h1>Payment Processing Error</h1>
          <p>There was an error processing your payment confirmation. Please contact support with reference: ${req.query.basketId || "N/A"}</p>
        </body>
      </html>
    `);
  }
};

export { handlePaymentSuccess };
