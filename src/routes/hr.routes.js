import express from "express";
import addEmployee from "../controllers/employee/addEmployee.js";
import validateSchema from "../middleware/validate.js";
import { addEmployeeSchema } from "../validations/addEmployeeSchema.js";
import { authenticateJWT } from "../middleware/auth.js";
import { upload } from "../helpers/multer.js";
import { addLetterSchema } from "../validations/addLetterSchema.js";
import { updateLetterSchema } from "../validations/updateLetterSchema.js";
import { deleteLetter } from "../controllers/HR/Letter/deleteLetter.js";
import { getLettersByEmployeeEmail } from "../controllers/HR/Letter/getEmployeeLetter.js";
import { createLetter } from "../controllers/HR/Letter/addLetter.js";
import { updateLetter } from "../controllers/HR/Letter/updateLetter.js";

const router = express.Router();

router.post(
  "/hr_add_emp",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  authenticateJWT,
  validateSchema(addEmployeeSchema),
  addEmployee
);

// Employee salary CRUD Routes
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

router.delete("/emp_letters", authenticateJWT, deleteLetter);

router.get("/emp_letters", authenticateJWT, getLettersByEmployeeEmail);

export default router;
