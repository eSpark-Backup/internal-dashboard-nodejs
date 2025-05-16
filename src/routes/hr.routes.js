import express from "express";
import addEmployee from "../controllers/employee/addEmployee.js";
import validateSchema from "../middleware/validate.js";
import { addSalarySchema, deleteSalarySchema, getSalarySchema, updateSalarySchema } from "../validations/SalarySchema.js";
import { addEmployeeSchema } from "../validations/addEmployeeSchema.js";
import { authenticateJWT } from "../middleware/auth.js";
import { upload } from "../helpers/multer.js";
import addSalary from "../controllers/HR/Salary/addSalary.js";
import getSalary from "../controllers/HR/Salary/getSalary.js";
import deleteSalary from "../controllers/HR/Salary/deleteSalary.js";
import updateSalary from "../controllers/HR/Salary/updateSalary.js";
import { getLettersByEmployeeEmail } from "../controllers/HR/Letter/getEmployeeLetter.js";
import { createLetter } from "../controllers/HR/Letter/addLetter.js";
import { updateLetter } from "../controllers/HR/Letter/updateLetter.js";
import {
  addLetterSchema,
  deleteLetterSchema,
  getLetterSchema,
  updateLetterSchema,
} from "../validations/letterSchema.js";
import { deleteLetter } from "../controllers/HR/Letter/deleteLetter.js";

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


// EMPLOYEE SALARY CRUD ROUTES
router.post(
  "/emp_salary",
  authenticateJWT,
  upload.fields([{ name: "pay_slip", maxCount: 1 }]),
  validateSchema(addSalarySchema),
  addSalary
);

router.get(
  "/emp_salary",
  authenticateJWT,
  validateSchema(getSalarySchema),
  getSalary
);

router.delete(
  "/emp_salary",
  authenticateJWT,
  validateSchema(deleteSalarySchema),
  deleteSalary
);

router.patch(
  "/emp_salary",
  authenticateJWT,
  upload.fields([{ name: "pay_slip", maxCount: 1 }]),
  validateSchema(updateSalarySchema),
  updateSalary
);


// EMPLOYEE SALARY PAYMENT ROUTES



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

router.delete(
  "/emp_letters",
  authenticateJWT,
  validateSchema(deleteLetterSchema),
  deleteLetter
);

router.get(
  "/emp_letters",
  authenticateJWT,
  validateSchema(getLetterSchema),
  getLettersByEmployeeEmail
);

export default router;
