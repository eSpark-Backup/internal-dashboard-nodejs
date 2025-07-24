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
import getClientContracts from "../controllers/client/companyContracts/getClientContracts.js";
import { updateClientPasswordSchema, updateCompanyNameSchema } from "../validations/companySchema.js";
import updateCompanyName from "../controllers/client/clientCompany/updateCompanyName.js";
import updateClientProfilePicture from "../controllers/client/clientCompany/updateClientProfilePicture.js";
import updateClientPassword from "../controllers/client/clientCompany/updateClientPassword.js";
import { getClientInvoicePaymentsSchema, updateInvoicePaymentStatusSchema } from "../validations/addOtherInvoiceSchema.js";
import getInvoicePayments from "../controllers/client/InvoicePayments/getInvoicePayments.js";
import updateInvoicePaymentStatus from "../controllers/client/InvoicePayments/updateInvoicePaymentStatus.js";
import { getClientPunchRequestSchema, updateClientPunchRequestSchema } from "../validations/clientClockInOutSchema.js";
import getClientPunchRequests from "../controllers/client/c_clockinout/getClientPunchRequests.js";
import updateClientPunchRequest from "../controllers/client/c_clockinout/updateClientPunchRequest.js";
import getClientTimeTracking from "../controllers/client/timeTracking/c_tracktime.js";
import { getClientTrackTimeSchema } from "../validations/trackingTimeSchema.js";
import { getClientLeaveRequestsSchema, updateClientLeaveRequestSchema } from "../validations/leaveRequestSchema.js";
import getLeaveRequests from "../controllers/client/LeaveRequests/getLeaveRequests.js";
import updateLeaveRequestStatus from "../controllers/client/LeaveRequests/updateLeaveRequest.js";
import getGuides from "../controllers/client/Guide/getGuides.js";
import getPolicies from "../controllers/client/Policy/getPolicies.js";
import getClientEmployeeContracts from "../controllers/client/EmployeeContracts/c_empcontract.js";
import getLeaveBalances from "../controllers/client/LeaveBalance/getLeaveBalance.js";
import getTimeOffDownloadReport from "../controllers/client/timeOff/getTimeOffDownloadReport.js";
import { getTimeOffDownloadReportSchema } from "../validations/getTimeOffDownloadReportSchema.js";
import getAvailableEmployees from "../controllers/client/timeTracking/getAvailableEmployees.js";

const router = express.Router();


// Home
router.get(
  "/c_home", 
  authenticateJWT, 
  getClientHome
);

// Hiring Requests
router.get(
  "/c_hr", 
  authenticateJWT, 
  getHiringRequests
);

router.delete(
  "/c_hr", 
  authenticateJWT, 
  deleteHiringRequest
);


// Start Hire
router.post(
  "/c_sh",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(clientStartHireSchema),
  addClientStartHire
);

// Team
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

// Update Interview Schedule
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


// Company Contracts
router.get(
  "/c_cmpcontract", 
  authenticateJWT, 
  getClientContracts
);


// Update Company Name
router.patch(
  "/c_upduser",
  authenticateJWT,
  validateSchema(updateCompanyNameSchema),
  updateCompanyName
);

// Update Client Profile Picture
router.post(
  "/c_updpic",
  authenticateJWT,
  upload.fields([{ name: "picture", maxCount: 1 }]),
  updateClientProfilePicture
);

// Update Client Password
router.patch(
  "/c_updpass",
  authenticateJWT,
  validateSchema(updateClientPasswordSchema),
  updateClientPassword
);

// Invoice Payments 
router.get(
  "/c_invpay",
  authenticateJWT,
  validateSchema(getClientInvoicePaymentsSchema),
  getInvoicePayments
);

// Update Invoice Payment Status
router.patch(
  "/c_invpay",
  authenticateJWT,
  validateSchema(updateInvoicePaymentStatusSchema),
  updateInvoicePaymentStatus
);

// Clock In Out
router.get(
  "/c_clockinout",
  authenticateJWT,
  validateSchema(getClientPunchRequestSchema),
  getClientPunchRequests
);

// Update Clock In Out
router.patch(
  "/c_clockinout",
  authenticateJWT,
  validateSchema(updateClientPunchRequestSchema),
  updateClientPunchRequest
);

// Time Tracking
router.get(
  "/c_tracktime",
  authenticateJWT,
  validateSchema(getClientTrackTimeSchema),
  getClientTimeTracking
);

// Leave Requests 
router.get(
  "/c_lr",
  authenticateJWT,
  validateSchema(getClientLeaveRequestsSchema),
  getLeaveRequests
);

// Update Leave Request Status
router.patch(
  "/c_lr",
  authenticateJWT,
  validateSchema(updateClientLeaveRequestSchema),
  updateLeaveRequestStatus
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

// Employee Contracts
router.get(
  "/c_empcontract", 
  authenticateJWT, 
  getClientEmployeeContracts
);

// Leave Balance
router.get(
  "/c_lb",
  authenticateJWT,
  getLeaveBalances
);

// Download Reports
router.get(
  "/c_downreport",
  authenticateJWT,
  validateSchema(getTimeOffDownloadReportSchema),
  getTimeOffDownloadReport
);


router.get(
  "/c_availemp",
  authenticateJWT,
  getAvailableEmployees
);


export default router;
