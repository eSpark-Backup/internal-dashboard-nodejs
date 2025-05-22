import express from "express";
import validateSchema from "../middleware/validate.js";
import { authenticateJWT } from "../middleware/auth.js";
import { upload } from "../helpers/multer.js";
import { addSalarySchema, deleteSalarySchema, getSalarySchema, updateSalarySchema } from "../validations/SalarySchema.js";
import {
  addLetterSchema,
  deleteLetterSchema,
  getLetterSchema,
  updateLetterSchema,
} from "../validations/letterSchema.js";
import { addEmployeeSchema, getEmployeeDetailsSchema, deleteEmployeeSchema } from "../validations/employeeSchema.js";
import addSalary from "../controllers/HR/Salary/addSalary.js";
import getSalary from "../controllers/HR/Salary/getSalary.js";
import deleteSalary from "../controllers/HR/Salary/deleteSalary.js";
import updateSalary from "../controllers/HR/Salary/updateSalary.js";
import getLettersByEmployeeEmail from "../controllers/HR/Letter/getEmployeeLetter.js";
import createLetter from "../controllers/HR/Letter/addLetter.js";
import updateLetter from "../controllers/HR/Letter/updateLetter.js";
import deleteLetter from "../controllers/HR/Letter/deleteLetter.js";
import addEmployee from "../controllers/employee/addEmployee.js";
import getEmployeeDetails from "../controllers/employee/GetEmployeeDetails.js";
import getEmployees from "../controllers/employee/GetEmployees.js";
import deleteEmployee from "../controllers/employee/deleteEmployee.js";
import hrHome from "../controllers/HR/Home/hrHome.js";
import { addBenefitSchema, deleteBenefitSchema, getBenefitSchema, updateBenefitSchema } from "../validations/benefitSchema.js";
import addBenefit from "../controllers/HR/Benefit/addBenefit.js";
import getBenefit from "../controllers/HR/Benefit/getBenefit.js";
import deleteBenefit from "../controllers/HR/Benefit/deleteBenefit.js";
import updateBenefit from "../controllers/HR/Benefit/updateBenefit.js";

const router = express.Router();


//HR Home Page
router.get("/hr_home", authenticateJWT, hrHome);


//Employee CRUD Routes 
router.get("/hr_emps", authenticateJWT, getEmployees);


router.post(
  "/hr_add_emp",
  authenticateJWT,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  validateSchema(addEmployeeSchema),
  addEmployee
);

router.get(
  "/hr_emp_prof",
  authenticateJWT,
  validateSchema(getEmployeeDetailsSchema),
  getEmployeeDetails
)

router.delete(
  "/hr_emps",
  authenticateJWT,
  validateSchema(deleteEmployeeSchema),
  deleteEmployee
);

//Employee CRUD Routes



// Employee salary CRUD Routes
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

// Employee salary CRUD Routes



// Employee letter CRUD Routes
router.post(
  "/emp_letters",
  authenticateJWT,
  upload.fields([{ name: "letter", maxCount: 1 }]),
  validateSchema(addLetterSchema),
  createLetter
);

router.get(
  "/emp_letters",
  authenticateJWT,
  validateSchema(getLetterSchema),
  getLettersByEmployeeEmail
);

router.delete(
  "/emp_letters",
  authenticateJWT,
  validateSchema(deleteLetterSchema),
  deleteLetter
);

router.patch(
  "/emp_letters",
  authenticateJWT,
  upload.single("letter"),
  validateSchema(updateLetterSchema),
  updateLetter
);

// Employee letter payment routes


// Employee Benefits Routes
router.post("/hr_emp_benefit",
  // authenticateJWT,
  validateSchema(addBenefitSchema),
  addBenefit
);

router.get("/hr_emp_benefit",
  // authenticateJWT,
  validateSchema(getBenefitSchema),
  getBenefit
);

router.delete("/hr_emp_benefit",
  // authenticateJWT,
  validateSchema(deleteBenefitSchema),
  deleteBenefit
);

router.patch("/hr_emp_benefit",
  // authenticateJWT,
  validateSchema(updateBenefitSchema),
  updateBenefit
);




export default router;
