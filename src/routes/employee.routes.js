import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { createWFHRequestSchema, deleteWFHRequestSchema, getWFHRequestSchema } from "../validations/wfhRequestsSchema.js";
import addWFHRequest from "../controllers/employee/WFHRequests/addWFHRequest.js";
import validateSchema from "../middleware/validate.js";
import { upload } from "../helpers/multer.js";
import getWFHRequests from "../controllers/employee/WFHRequests/getWFHRequests.js";
import deleteWFHRequest from "../controllers/employee/WFHRequests/deleteWFHRequest.js";
import { createPunchRequestSchema, deletePunchRequestSchema, getPunchRequestSchema } from "../validations/punchRequestsSchema.js";
import addPunchRequest from "../controllers/employee/PunchRequests/AddPunchRequest.js";
import getPunchRequests from "../controllers/employee/PunchRequests/getPunchRequests.js";
import deletePunchRequest from "../controllers/employee/PunchRequests/deletePunchRequest.js";

const router = express.Router();


// Employee WFH Request CRUD Routes
router.post(
  "/emp_wfhr",
  authenticateJWT,
  upload.none(),
  validateSchema(createWFHRequestSchema),
  addWFHRequest
);

router.get(
  "/emp_wfhr",
  authenticateJWT,
  validateSchema(getWFHRequestSchema),
  getWFHRequests
);

router.delete(
  "/emp_wfhr",
  authenticateJWT,
  validateSchema(deleteWFHRequestSchema),
  deleteWFHRequest
);

// Employee WFH Request CRUD Routes


// Employee Punch Request Routes
router.post(
  "/emp_pr",
  authenticateJWT,
  upload.none(),
  validateSchema(createPunchRequestSchema),
  addPunchRequest
);

router.get(
  "/emp_pr",
  authenticateJWT,
  validateSchema(getPunchRequestSchema),
  getPunchRequests
);

router.delete(
  "/emp_pr",
  authenticateJWT,
  validateSchema(deletePunchRequestSchema),
  deletePunchRequest
);


export default router;
