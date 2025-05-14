  import express from "express";
  import dotenv from "dotenv";
  import {dirname, join} from 'path'
  import {fileURLToPath} from 'url';
  import swaggerUi from 'swagger-ui-express';
  import { logger } from './helpers/logger.js'
  import YAML from "yamljs";
  import authRoutes from "./routes/auth.routes.js";
  import employeeRoutes from "./routes/employee.routes.js";
  import clientRoutes from "./routes/client.routes.js";
  import hrRoutes from "./routes/hr.routes.js";

  dotenv.config();

  const __filename = fileURLToPath(import.meta.url);
  const _dirname = dirname(__filename);
  dotenv.config({path: join(_dirname, '../.env')})

  const swaggerDocument = YAML.load(join(_dirname, '/docs/swagger.yaml'));

  const app = express();

  if (process.env.ENV !== 'prod') {
    logger.info(`API docs exposed at /api-docs`)
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  // Middleware
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  // Routes
  app.use("/api", authRoutes);
  app.use("/api", hrRoutes);
  app.use("/api", employeeRoutes);
  app.use("/api", clientRoutes);
  
  // Logging
  app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
  });

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint not found" });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("Error occurred:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  export default app;
