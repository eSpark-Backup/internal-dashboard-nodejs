import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import getClientHome from "../controllers/client/Home/getClientHome.js";
import getHiringRequests from "../controllers/client/HiringRequests/getHiringRequests.js";
import deleteHiringRequest from "../controllers/client/HiringRequests/deleteHiringRequest.js";

import { clientStartHireSchema } from "../validations/clientStartHireSchema.js";
import addClientStartHire from "../controllers/client/startHire/addClientStartHire.js";
import { upload } from "../helpers/multer.js";
import validateSchema from "../middleware/validate.js";
import { getClientTeamSchema } from "../validations/getClientTeamSchema.js";
import getClientTeam from "../controllers/client/clientTeam/getClientTeam.js";
import getInterviewSchedules from "../controllers/client/InterviewSchedule/getInterviewSchedules.js";
import { clientUpdateInterviewScheduleSchema } from "../validations/interviewScheduleSchema.js";
import updateInterviewSchedule from "../controllers/client/InterviewSchedule/updateInterviewSchedule.js";
import getOnboardings from "../controllers/client/OnBoardings/getOnboardings.js";
import getGuides from "../controllers/client/Guide/getGuides.js";
import getPolicies from "../controllers/client/Policy/getPolicies.js";
import getClientEmployeeContracts from "../controllers/client/EmployeeContracts/c_empcontract.js";
import getLeaveBalance from "../controllers/client/LeaveBalance/getLeaveBalance.js";
import getLeaveBalances from "../controllers/client/LeaveBalance/getLeaveBalance.js";

const router = express.Router();

router.get("/c_home", authenticateJWT, getClientHome);

// Hiring Requests

router.get("/c_hr", authenticateJWT, getHiringRequests);

router.delete("/c_hr", authenticateJWT, deleteHiringRequest);


// Start Hire 

router.post(
  "/c_sh",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(clientStartHireSchema),
  addClientStartHire
);

router.get(
  "/c_team",
  authenticateJWT,
  validateSchema(getClientTeamSchema),
  getClientTeam
);

// Interview Schedule 

router.get(
  "/c_is",
  authenticateJWT,
  getInterviewSchedules
);

router.patch(
  "/c_is",
  authenticateJWT,
  validateSchema(clientUpdateInterviewScheduleSchema),
  updateInterviewSchedule
);

// Onboarding 

router.get(
  "/c_onboard",
  authenticateJWT,
  getOnboardings
);

// Guide 

router.get(
  "/c_guide",
  authenticateJWT,
  getGuides
);


// Policy 

router.get(
  "/c_policy",
  authenticateJWT,
  getPolicies
);

router.get(
  "/c_empcontract", 
  authenticateJWT, 
  getClientEmployeeContracts
);

router.get(
  "/c_lb",
  authenticateJWT,
  getLeaveBalances
);


export default router;
