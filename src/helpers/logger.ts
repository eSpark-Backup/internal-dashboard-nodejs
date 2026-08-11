import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const LOG_LEVELS = {
  BASIC: "basic",
  DEBUG: "debug",
  FULL: "full",
};

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const loggerFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createFileTransport = (level) => {
  return new DailyRotateFile({
    filename: `logs/%DATE%-${level}`,
    extension: ".log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
  });
};

export function setupLogger() {
  const rawLogLevel = (process.env.LOG_LEVEL || "basic").toLowerCase();
  const loggingType = Object.values(LOG_LEVELS).includes(rawLogLevel)
    ? rawLogLevel
    : LOG_LEVELS.BASIC;

  const logger = winston.createLogger({ format: loggerFormat });

  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );

  switch (loggingType) {
    case LOG_LEVELS.FULL:
      logger.add(createFileTransport("full"));
      logger.level = "silly";
      break;
    case LOG_LEVELS.DEBUG:
      logger.add(createFileTransport("debug"));
      logger.level = "debug";
      break;
    case LOG_LEVELS.BASIC:
    default:
      logger.add(createFileTransport("basic"));
      logger.level = "info";
      break;
  }

  logger.startOperation = (operationName, data = {}) => {
    logger.info(`Starting ${operationName}`, {
      operation: operationName,
      status: "start",
      ...data,
    });
  };

  logger.endOperation = (operationName, data = {}) => {
    logger.info(`Completed ${operationName}`, {
      operation: operationName,
      status: "end",
      ...data,
    });
  };

  logger.failOperation = (operationName, error, data = {}) => {
    logger.error(`Failed ${operationName}`, {
      operation: operationName,
      status: "error",
      error: error.message,
      stack: error.stack,
      ...data,
    });
  };

  return logger;
}

export const logger = setupLogger();
