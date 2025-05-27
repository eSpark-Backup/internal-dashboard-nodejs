import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import validateSchema from "../middleware/validate.js";
import {
  addLeaveRequestSchema,
  deleteLeaveRequestSchema,
  getLeaveRequestSchema,
} from "../validations/leaveRequestSchema.js";
import createLeaveRequest from "../controllers/employee/LeaveRequest/createLeaveRequest.js";
import { upload } from "../helpers/multer.js";
import deleteLeaveRequest from "../controllers/employee/LeaveRequest/deleteLeaveRequest.js";
import getLeaveRequest from "../controllers/employee/LeaveRequest/getLeaveRequest.js";

const router = express.Router();

router.get("/emp", authenticateJWT, (req, res) => {
  res.json({ message: "Employee route" });
});

router.post(
  "/emp_lr/",
  authenticateJWT,
  upload.fields([{ name: "attachment", maxCount: 1 }]),
  validateSchema(addLeaveRequestSchema),
  createLeaveRequest
);

router.delete(
  "/emp_lr",
  authenticateJWT,
  validateSchema(deleteLeaveRequestSchema),
  deleteLeaveRequest
);

router.get(
  "/emp_lr",
  authenticateJWT,
  validateSchema(getLeaveRequestSchema),
  getLeaveRequest
);

export default router;
