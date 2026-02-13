import http from "http";
import app from "./app.js";
import { runMigrations } from "./helpers/migrate.js";
import UpdateTimeSheet from "./controllers/employee/Home/updateTimeSheet.js";
import { initializeCronJobs } from "./jobs/index.js";
import payfastConfig from "./config/payfast.config.js";

async function startServer() {
  // Validate PayFast configuration on startup
  try {
    payfastConfig.validate();
  } catch (error) {
    console.error("\n❌ PayFast Configuration Error:", error.message);
    console.error(
      "Please check your .env file and ensure all required PayFast variables are set.",
    );
    process.exit(1);
  }

  try {
    await runMigrations();

    const server = http.createServer(app);
    const PORT = process.env.PORT || 3000;

    // Initialize cron jobs
    initializeCronJobs();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      const updateTimeSheet = new UpdateTimeSheet();
      updateTimeSheet.updateTimeSheet();
    });
  } catch (error) {
    console.error("Error during migrations or server startup:", error);
    process.exit(1);
  }
}

startServer();
