import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { createLetter } from "../controllers/employee/addLetter.js";
import validateSchema from "../middleware/validate.js";
import { addLetterSchema } from "../validations/addLetterSchema.js";
import { upload } from "../helpers/multer.js";
import { updateLetter } from "../controllers/employee/updateLetter.js";
import { updateLetterSchema } from "../validations/updateLetterSchema.js";

const router = express.Router();

router.get("/emp", authenticateJWT, (req, res) => {
  res.json({ message: "Employee route" });
});

router.post(
  "/emp_letters",
  upload.fields([{ name: "letter", maxCount: 1 }]),
  authenticateJWT,
  validateSchema(addLetterSchema),
  createLetter
);

router.patch(
  "/emp_letters",
  authenticateJWT,
  validateSchema(updateLetterSchema),
  upload.single("letter"),
  updateLetter
);

export default router;
