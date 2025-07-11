import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import getClientHome from "../controllers/client/Home/getClientHome.js";
import getHiringRequests from "../controllers/client/HiringRequests/getHiringRequests.js";
import deleteHiringRequest from "../controllers/client/HiringRequests/deleteHiringRequest.js";

import { clientStartHireSchema } from "../validations/clientStartHireSchema.js";
import addClientStartHire from "../controllers/client/startHire/addClientStartHire.js";
import { upload } from "../helpers/multer.js";
import validateSchema from "../middleware/validate.js";
import getOnboardings from "../controllers/client/OnBoardings/getOnboardings.js";

const router = express.Router();

router.get("/c_home", authenticateJWT, getClientHome);

// Hiring Requests 

router.get("/c_hr",
  authenticateJWT,
  getHiringRequests
);

router.delete("/c_hr",
  authenticateJWT,
  deleteHiringRequest 
);

router.post(
  "/c_sh",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(clientStartHireSchema),
  addClientStartHire
);

// Onboarding 

router.get(
  "/c_onboard",
  authenticateJWT,
  getOnboardings
);

export default router;
