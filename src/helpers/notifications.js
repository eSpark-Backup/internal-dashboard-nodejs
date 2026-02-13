import pool from "../config/db.js";
import { logger } from "./logger.js";

/**
 * Create a notification in the database
 */
const createNotification = async ({
  email,
  refId,
  notificationType,
  description,
  status = "pending",
}) => {
  try {
    if (!email) {
      logger.warn(
        `createNotification: missing email, skipping notification: ${notificationType}`,
      );
      return null;
    }
    const query = `
      INSERT INTO eSparkTalentAPI_notifications 
        (email, ref_id, notification_type, description, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await pool.query(query, [
      email,
      refId,
      notificationType,
      description,
      status,
    ]);

    logger.info(`Notification created: ${notificationType} for ${email}`);
    return result.rows[0].id;
  } catch (error) {
    logger.error("Failed to create notification:", error);
    throw error;
  }
};

/**
 * Create payment success notification
 */
const createPaymentSuccessNotification = async ({
  clientEmail,
  hrEmail,
  invoiceId,
  invoiceType,
  employeeName,
  amount,
  transactionId,
  billingMonth,
}) => {
  try {
    const monthName = billingMonth
      ? new Date(billingMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "";

    // Client notification
    const clientDescription =
      invoiceType === "SALARY"
        ? `Payment confirmed for ${employeeName} - ${monthName}. Amount: PKR ${amount}. Transaction ID: ${transactionId}`
        : `Payment confirmed for Invoice #${invoiceId}. Amount: PKR ${amount}. Transaction ID: ${transactionId}`;

    await createNotification({
      email: clientEmail,
      refId: invoiceId,
      notificationType: "payment_success",
      description: clientDescription,
      status: "pending",
    });

    // HR notification
    if (hrEmail) {
      const hrDescription =
        invoiceType === "SALARY"
          ? `Client payment received: ${employeeName} - ${monthName}. Amount: PKR ${amount}. Transaction: ${transactionId}`
          : `Client payment received: Invoice #${invoiceId}. Amount: PKR ${amount}. Transaction: ${transactionId}`;

      await createNotification({
        email: hrEmail,
        refId: invoiceId,
        notificationType: "payment_success",
        description: hrDescription,
        status: "pending",
      });
    }

    logger.info(
      `Payment success notifications created for invoice ${invoiceId}`,
    );
  } catch (error) {
    logger.error("Failed to create payment success notifications:", error);
  }
};

/**
 * Create payment failure notification
 */
const createPaymentFailureNotification = async ({
  clientEmail,
  hrEmail,
  invoiceId,
  invoiceType,
  employeeName,
  amount,
  errorMessage,
  billingMonth,
}) => {
  try {
    const monthName = billingMonth
      ? new Date(billingMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "";

    // Client notification
    const clientDescription =
      invoiceType === "SALARY"
        ? `Payment failed for ${employeeName} - ${monthName}. Amount: PKR ${amount}. Reason: ${errorMessage}. Please try again.`
        : `Payment failed for Invoice #${invoiceId}. Amount: PKR ${amount}. Reason: ${errorMessage}. Please try again.`;

    await createNotification({
      email: clientEmail,
      refId: invoiceId,
      notificationType: "payment_failed",
      description: clientDescription,
      status: "pending",
    });

    // HR notification
    if (hrEmail) {
      const hrDescription =
        invoiceType === "SALARY"
          ? `Client payment failed: ${employeeName} - ${monthName}. Amount: PKR ${amount}. Reason: ${errorMessage}`
          : `Client payment failed: Invoice #${invoiceId}. Amount: PKR ${amount}. Reason: ${errorMessage}`;

      await createNotification({
        email: hrEmail,
        refId: invoiceId,
        notificationType: "payment_failed",
        description: hrDescription,
        status: "pending",
      });
    }

    logger.info(`Payment failure notifications created`);
  } catch (error) {
    logger.error("Failed to create payment failure notifications:", error);
  }
};

/**
 * Create bulk payment success notification
 */
const createBulkPaymentNotification = async ({
  clientEmail,
  hrEmail,
  invoiceCount,
  totalAmount,
  transactionId,
  invoiceType,
}) => {
  try {
    // Client notification
    const clientDescription = `Bulk payment confirmed for ${invoiceCount} ${invoiceType === "SALARY" ? "salary" : "custom"} invoices. Total amount: PKR ${totalAmount}. Transaction ID: ${transactionId}`;

    await createNotification({
      email: clientEmail,
      refId: null,
      notificationType: "bulk_payment_success",
      description: clientDescription,
      status: "pending",
    });

    // HR notification
    if (hrEmail) {
      const hrDescription = `Client bulk payment received: ${invoiceCount} invoices, Total: PKR ${totalAmount}. Transaction: ${transactionId}`;

      await createNotification({
        email: hrEmail,
        refId: null,
        notificationType: "bulk_payment_success",
        description: hrDescription,
        status: "pending",
      });
    }

    logger.info(
      `Bulk payment notifications created: ${invoiceCount} invoices, PKR ${totalAmount}`,
    );
  } catch (error) {
    logger.error("Failed to create bulk payment notifications:", error);
  }
};

/**
 * Mark notification as completed/sent
 */
const markNotificationCompleted = async (notificationId) => {
  try {
    const query = `
      UPDATE eSparkTalentAPI_notifications
      SET status = 'completed'
      WHERE id = $1
    `;

    await pool.query(query, [notificationId]);
    logger.info(`Notification ${notificationId} marked as completed`);
  } catch (error) {
    logger.error(
      `Failed to mark notification ${notificationId} as completed:`,
      error,
    );
  }
};

/**
 * Get pending notifications for a user
 */
const getPendingNotifications = async (email) => {
  try {
    const query = `
      SELECT 
        id,
        ref_id,
        notification_type,
        description,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query, [email]);
    return result.rows;
  } catch (error) {
    logger.error("Failed to get pending notifications:", error);
    return [];
  }
};

export {
  createNotification,
  createPaymentSuccessNotification,
  createPaymentFailureNotification,
  createBulkPaymentNotification,
  markNotificationCompleted,
  getPendingNotifications,
};
