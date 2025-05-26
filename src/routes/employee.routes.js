import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { createWFHRequestSchema, deleteWFHRequestSchema, getWFHRequestSchema } from "../validations/wfhRequestsSchema.js";
import addWFHRequest from "../controllers/employee/WFHRequests/addWFHRequest.js";
import validateSchema from "../middleware/validate.js";
import { upload } from "../helpers/multer.js";
import getWFHRequests from "../controllers/employee/WFHRequests/getWFHRequests.js";
import deleteWFHRequest from "../controllers/employee/WFHRequests/deleteWFHRequest.js";

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

export default router;
