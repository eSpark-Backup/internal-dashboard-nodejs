import { format } from "date-fns";
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

export {
  getFormattedTimestamp,
  encrypt,
  decrypt,
  validateEmpLeavesPatchSchema,
};
