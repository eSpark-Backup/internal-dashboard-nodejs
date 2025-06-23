import { format } from "date-fns";
import fs from "fs";
import { removeFromS3 } from "./s3.js";
import { logger } from "./logger.js";
import crypto from "crypto";
import validateSchema from "../middleware/validate.js";
import {
  patchLeaveSchema,
  patchTimeSchema,
} from "../validations/timeAndLeavesSchema.js";

const AES_ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = Buffer.from(
  "7d5f963ec91f2c45e84ac8d0c8e82d9a15eae20b7fc5e3c43fc23237e13f8b26",
  "hex"
);
const ENCRYPTION_IV = Buffer.from("1c3db7343ed94480b57a6ee5e6f3a25c", "hex");

const getFormattedTimestamp = () => {
  return format(new Date(), "MM-dd-yyyy_HH-mm-ss");
};

function encrypt(plaintext) {
  const cipher = crypto.createCipheriv(
    AES_ALGORITHM,
    ENCRYPTION_KEY,
    ENCRYPTION_IV
  );
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf-8")),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

function decrypt(encryptedBase64) {
  const encryptedBuffer = Buffer.from(encryptedBase64, "base64");
  const decipher = crypto.createDecipheriv(
    AES_ALGORITHM,
    ENCRYPTION_KEY,
    ENCRYPTION_IV
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}

const validateEmpLeavesPatchSchema = (req, res, next) => {
  const { tab } = req.query;
  if (!["time", "leaves"].includes(tab)) {
    return res.status(400).json({ message: "Invalid tab parameter" });
  }
  const schema = tab === "time" ? patchTimeSchema : patchLeaveSchema;
  return validateSchema(schema)(req, res, next);
};

const validateAndCleanTime = (timeStr) => {
  if (!timeStr?.trim()) {
      throw new Error('Time is required');
  }

  const cleanTime = decodeURIComponent(timeStr).trim();

  if (!cleanTime.match(/\s*(AM|PM|am|pm)\s*$/)) {
      throw new Error('Time must include AM or PM');
  }

  if (!cleanTime.match(/^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)$/)) {
      throw new Error('Invalid time format. Use HH:mm AM/PM or HH:mm:ss AM/PM');
  }

  return cleanTime;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "-") {
      throw new Error("Invalid time string");
  }

  timeStr = timeStr.trim();
  let hours, minutes;

  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
      const isPM = timeStr.toUpperCase().includes('PM');
      const timeOnly = timeStr.replace(/\s*(AM|PM|am|pm)\s*/gi, '').trim();
      const parts = timeOnly.split(':');

      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) {
          throw new Error("Failed to parse AM/PM time components");
      }

      if (isPM && hours !== 12) {
          hours += 12;
      } else if (!isPM && hours === 12) {
          hours = 0;
      }
  } else if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
  } else {
      throw new Error("Unrecognized time format");
  }

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time values: hours=${hours}, minutes=${minutes}`);
  }

  return hours * 60 + minutes;
};

const cleanupFiles = async (files = []) => {
  for (const file of files) {
    const { localPath, s3Key } = file;

    // Remove local file
    if (localPath) {
      try {
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (err) {
        logger.warn(`Failed to delete local file (${localPath}):`, err);
      }
    }

    // Remove from S3
    if (s3Key) {
      try {
        await removeFromS3(s3Key);
      } catch (err) {
        logger.warn(`Failed to delete S3 file (${s3Key}):`, err);
      }
    }
  }
};


export {
  getFormattedTimestamp,
  encrypt,
  decrypt,
  validateEmpLeavesPatchSchema,
  validateAndCleanTime,
  parseTimeToMinutes,
  cleanupFiles,
};
