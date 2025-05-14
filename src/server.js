import http from "http";
import app from "./app.js";
import { runMigrations } from "./helpers/migrate.js";

async function startServer() {
  try {
    await runMigrations();

    const server = http.createServer(app);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error during migrations or server startup:", error);
    process.exit(1);
  }
}

startServer();
