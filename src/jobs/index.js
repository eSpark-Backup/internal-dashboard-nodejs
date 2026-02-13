import cron from "node-cron";
import generateMonthlyInvoices from "./billing/monthlyInvoiceGenerator.js";
import sendInvoiceReminders from "./billing/invoiceReminder.js";
import checkOverdueInvoices from "./billing/overdueChecker.js";
import { logger } from "../helpers/logger.js";

const initializeCronJobs = () => {
  const cronEnabled = process.env.ENABLE_CRON_JOBS === "true";

  if (!cronEnabled) {
    logger.warn(
      "⚠️  Cron jobs are DISABLED via ENABLE_CRON_JOBS environment variable",
    );
    return;
  }

  logger.info("🚀 Initializing cron jobs...");

  // Get schedules from environment or use defaults
  const invoiceGenSchedule = process.env.CRON_INVOICE_GENERATION || "0 2 1 * *";
  const reminderSchedule = process.env.CRON_INVOICE_REMINDER || "0 9 * * *";
  const overdueSchedule = process.env.CRON_OVERDUE_CHECKER || "0 10 * * *";

  // Monthly Invoice Generation
  cron.schedule(invoiceGenSchedule, async () => {
    logger.info("📅 Running monthly invoice generation cron...");
    try {
      await generateMonthlyInvoices();
    } catch (error) {
      logger.error("❌ Monthly invoice generation cron failed:", error);
    }
  });
  logger.info(`✅ Monthly invoice generation scheduled: ${invoiceGenSchedule}`);

  // Invoice Reminder
  cron.schedule(reminderSchedule, async () => {
    logger.info("🔔 Running invoice reminder cron...");
    try {
      await sendInvoiceReminders();
    } catch (error) {
      logger.error("❌ Invoice reminder cron failed:", error);
    }
  });
  logger.info(`✅ Invoice reminder scheduled: ${reminderSchedule}`);

  // Overdue Checker
  cron.schedule(overdueSchedule, async () => {
    logger.info("⏰ Running overdue invoice checker cron...");
    try {
      await checkOverdueInvoices();
    } catch (error) {
      logger.error("❌ Overdue invoice checker cron failed:", error);
    }
  });
  logger.info(`✅ Overdue checker scheduled: ${overdueSchedule}`);

  logger.info("✅ All cron jobs initialized successfully");
};

export {
  initializeCronJobs,
  generateMonthlyInvoices,
  sendInvoiceReminders,
  checkOverdueInvoices,
};
