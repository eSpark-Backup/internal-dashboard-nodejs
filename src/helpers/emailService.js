import { logger } from "./logger.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

/**
 * Email Service
 * Integration point for email provider
 */

/**
 * Fetch client email safely from database
 */
const getClientEmail = async (clientId) => {
  const res = await db.query(
    `SELECT email, first_name, last_name FROM eSparkTalentAPI_client WHERE id = $1`,
    [clientId],
  );
  if (!res.rows.length) throw new Error(`Client with ID ${clientId} not found`);
  return res.rows[0].email;
};

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Build sender name and email
const buildFromAddress = () => {
  const fromName = process.env.SMTP_FROM_NAME || "eSpark Talent";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  return `"${fromName}" <${fromEmail}>`;
};

/**
 * Send payment success email
 */
const sendPaymentSuccessEmail = async ({
  clientId,
  invoiceId,
  amount,
  transactionId,
  employeeName,
  billingMonth,
}) => {
  try {
    const to = await getClientEmail(clientId);

    const emailData = {
      to,
      subject: "Payment Confirmation - eSpark Talent",
      html: `
        <h2>Payment Confirmed</h2>
        <p>Your payment has been processed successfully.</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Billing Month:</strong> ${billingMonth}</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p>Thank you for your payment.</p>
      `,
    };

    await transporter.sendMail({
      from: buildFromAddress(),
      to: to,
      subject: emailData.subject,
      html: emailData.html,
    });

    logger.info(`[EMAIL] Payment success email sent to ${to}`);

    return { success: true };
  } catch (error) {
    logger.error("Failed to send payment success email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment failure email
 */
const sendPaymentFailureEmail = async ({
  clientId,
  invoiceId,
  amount,
  errorMessage,
  employeeName,
  billingMonth,
}) => {
  try {
    const to = await getClientEmail(clientId);
    const emailData = {
      to,
      subject: "Payment Failed - eSpark Talent",
      html: `
        <h2>Payment Failed</h2>
        <p>We were unable to process your payment.</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Billing Month:</strong> ${billingMonth}</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Reason:</strong> ${errorMessage}</p>
        <p>Please try again or contact support if the issue persists.</p>
      `,
    };

    await transporter.sendMail({
      from: buildFromAddress(),
      to: to,
      subject: emailData.subject,
      html: emailData.html,
    });

    logger.info(`[EMAIL] Payment failure email sent to ${to}`);

    return { success: true };
  } catch (error) {
    logger.error("Failed to send payment failure email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send invoice generated email
 */
const sendInvoiceGeneratedEmail = async ({
  clientId,
  invoiceId,
  amount,
  dueDate,
  employeeName,
  billingMonth,
}) => {
  try {
    const to = await getClientEmail(clientId);
    const emailData = {
      to,
      subject: "New Invoice Generated - eSpark Talent",
      html: `
        <h2>New Invoice</h2>
        <p>A new salary invoice has been generated.</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Billing Month:</strong> ${billingMonth}</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p>Please login to make payment.</p>
      `,
    };

    await transporter.sendMail({
      from: buildFromAddress(),
      to: to,
      subject: emailData.subject,
      html: emailData.html,
    });

    logger.info(`[EMAIL] Invoice generated email sent to ${to}`);

    return { success: true };
  } catch (error) {
    logger.error("Failed to send invoice generated email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment reminder email
 */
const sendPaymentReminderEmail = async ({
  clientId,
  invoiceId,
  amount,
  dueDate,
  employeeName,
  billingMonth,
}) => {
  try {
    const to = await getClientEmail(clientId);
    const emailData = {
      to,
      subject: "Payment Reminder - eSpark Talent",
      html: `
        <h2>Payment Reminder</h2>
        <p>This is a reminder that your invoice payment is due soon.</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Billing Month:</strong> ${billingMonth}</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p>Please make payment before the due date to avoid late fees.</p>
      `,
    };

    await transporter.sendMail({
      from: buildFromAddress(),
      to: to,
      subject: emailData.subject,
      html: emailData.html,
    });

    logger.info(`[EMAIL] Payment reminder email sent to ${to}`);

    return { success: true };
  } catch (error) {
    logger.error("Failed to send payment reminder email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send overdue notification email
 */
const sendOverdueNotificationEmail = async ({
  clientId,
  invoiceId,
  amount,
  daysOverdue,
  employeeName,
  billingMonth,
}) => {
  try {
    const to = await getClientEmail(clientId);
    const emailData = {
      to,
      subject: "OVERDUE: Immediate Payment Required - eSpark Talent",
      html: `
        <h2>Payment Overdue</h2>
        <p><strong>URGENT:</strong> Your invoice payment is overdue.</p>
        <p><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Billing Month:</strong> ${billingMonth}</p>
        <p><strong>Amount:</strong> PKR ${amount}</p>
        <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
        <p>Please make immediate payment to avoid service disruption.</p>
      `,
    };

    await transporter.sendMail({
      from: buildFromAddress(),
      to: to,
      subject: emailData.subject,
      html: emailData.html,
    });

    logger.info(`[EMAIL] Overdue notification email sent to ${to}`);

    return { success: true };
  } catch (error) {
    logger.error("Failed to send overdue notification email:", error);
    return { success: false, error: error.message };
  }
};

export {
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendInvoiceGeneratedEmail,
  sendPaymentReminderEmail,
  sendOverdueNotificationEmail,
};
