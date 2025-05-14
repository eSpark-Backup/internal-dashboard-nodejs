import express from "express";
import addEmployee, { upload } from "../controllers/employee/addEmployee.js";
import validateSchema from "../middleware/validate.js";
import { addEmployeeSchema } from "../validations/addEmployeeSchema.js";
import { authenticateJWT } from "../middleware/auth.js";

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

export default router;
