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
import {
  updateClientPasswordSchema,
  updateCompanyNameSchema,
} from "../validations/companySchema.js";
import updateCompanyName from "../controllers/client/clientCompany/updateCompanyName.js";
import updateClientProfilePicture from "../controllers/client/clientCompany/updateClientProfilePicture.js";
import updateClientPassword from "../controllers/client/clientCompany/updateClientPassword.js";
import {
  getClientInvoicePaymentsSchema,
  updateInvoicePaymentStatusSchema,
  manualInvoicePaymentSchema,
} from "../validations/addOtherInvoiceSchema.js";
import getInvoicePayments from "../controllers/client/InvoicePayments/getInvoicePayments.js";
import updateInvoicePaymentStatus from "../controllers/client/InvoicePayments/updateInvoicePaymentStatus.js";
import manualPayment from "../controllers/client/InvoicePayments/manualPayment.js";
import {
  getClientPunchRequestSchema,
  updateClientPunchRequestSchema,
} from "../validations/clientClockInOutSchema.js";
import getClientPunchRequests from "../controllers/client/c_clockinout/getClientPunchRequests.js";
import updateClientPunchRequest from "../controllers/client/c_clockinout/updateClientPunchRequest.js";
import getClientTimeTracking from "../controllers/client/timeTracking/c_tracktime.js";
import {
  getClientTrackTimeReportSchema,
  getClientTrackTimeSchema,
} from "../validations/trackingTimeSchema.js";
import {
  getClientLeaveRequestsSchema,
  updateClientLeaveRequestSchema,
} from "../validations/leaveRequestSchema.js";
import getLeaveRequests from "../controllers/client/LeaveRequests/getLeaveRequests.js";
import updateLeaveRequestStatus from "../controllers/client/LeaveRequests/updateLeaveRequest.js";
import getGuides from "../controllers/client/Guide/getGuides.js";
import getPolicies from "../controllers/client/Policy/getPolicies.js";
import getClientEmployeeContracts from "../controllers/client/EmployeeContracts/c_empcontract.js";
import getLeaveBalances from "../controllers/client/LeaveBalance/getLeaveBalance.js";
import getTimeOffDownloadReport from "../controllers/client/timeOff/getTimeOffDownloadReport.js";
import { getTimeOffDownloadReportSchema } from "../validations/getTimeOffDownloadReportSchema.js";
import getClientTimeTrackingReport from "../controllers/client/timeTracking/getClientTimeTrackingReport.js";
import getAvailableEmployees from "../controllers/client/timeTracking/getAvailableEmployees.js";
import paymentInitiationSchema from "../validations/paymentInitiationSchema.js";
import bulkPaymentSchema from "../validations/bulkPaymentSchema.js";
import validate from "../middleware/validate.js";
import webhookHandler from "../controllers/client/payments/webhookHandler.js";

import initiatePayment from "../controllers/client/payments/initiatePayment.js";
import bulkPayment from "../controllers/client/payments/bulkPayment.js";

const router = express.Router();

// Home
router.get("/c_home", authenticateJWT, getClientHome);

router.post(
  "/payments/initiate",
  authenticateJWT,
  validate(paymentInitiationSchema, "body"),
  initiatePayment,
);
router.post(
  "/payments/bulk",
  authenticateJWT,
  validate(bulkPaymentSchema, "body"),
  bulkPayment,
);

router.post("/payfast/webhook", webhookHandler);

// Get Hiring Requests
router.get("/c_hr", authenticateJWT, getHiringRequests);

// Delete Hiring Request
router.delete("/c_hr", authenticateJWT, deleteHiringRequest);

// Start Hire
router.post(
  "/c_sh",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(clientStartHireSchema),
  addClientStartHire,
);

// Get Team
router.get(
  "/c_team",
  authenticateJWT,
  validateSchema(getClientTeamSchema),
  getClientTeam,
);

// Get Interview Schedule
router.get("/c_is", authenticateJWT, getInterviewSchedules);

// Update Interview Schedule
router.patch(
  "/c_is",
  authenticateJWT,
  validateSchema(clientUpdateInterviewScheduleSchema),
  updateInterviewSchedule,
);

// Get Onboarding
router.get("/c_onboard", authenticateJWT, getOnboardings);

// Get Company Contracts
router.get("/c_cmpcontract", authenticateJWT, getClientContracts);

// Update Company Name
router.patch(
  "/c_upduser",
  authenticateJWT,
  validateSchema(updateCompanyNameSchema),
  updateCompanyName,
);

// Update Client Profile Picture
router.post(
  "/c_updpic",
  authenticateJWT,
  upload.fields([{ name: "picture", maxCount: 1 }]),
  updateClientProfilePicture,
);

// Update Client Password
router.patch(
  "/c_updpass",
  authenticateJWT,
  validateSchema(updateClientPasswordSchema),
  updateClientPassword,
);

// Get Invoice Payments
router.get(
  "/c_invpay",
  authenticateJWT,
  validateSchema(getClientInvoicePaymentsSchema),
  getInvoicePayments,
);

// Update Invoice Payment Status
router.patch(
  "/c_invpay",
  authenticateJWT,
  validateSchema(updateInvoicePaymentStatusSchema),
  updateInvoicePaymentStatus,
);

// Submit manual payment request
router.post(
  "/invoices/:id/manual-payment",
  authenticateJWT,
  validateSchema(manualInvoicePaymentSchema),
  manualPayment,
);

// Get Clock In Out
router.get(
  "/c_clockinout",
  authenticateJWT,
  validateSchema(getClientPunchRequestSchema),
  getClientPunchRequests,
);

// Update Clock In Out
router.patch(
  "/c_clockinout",
  authenticateJWT,
  validateSchema(updateClientPunchRequestSchema),
  updateClientPunchRequest,
);

// Get Time Tracking
router.get(
  "/c_tracktime",
  authenticateJWT,
  validateSchema(getClientTrackTimeSchema),
  getClientTimeTracking,
);

// Get Leave Requests
router.get(
  "/c_lr",
  authenticateJWT,
  validateSchema(getClientLeaveRequestsSchema),
  getLeaveRequests,
);

// Update Leave Request Status
router.patch(
  "/c_lr",
  authenticateJWT,
  validateSchema(updateClientLeaveRequestSchema),
  updateLeaveRequestStatus,
);

// Get Guide
router.get("/c_guide", authenticateJWT, getGuides);

// Get Policy
router.get("/c_policy", authenticateJWT, getPolicies);

// Get Employee Contracts
router.get("/c_empcontract", authenticateJWT, getClientEmployeeContracts);

// Get Leave Balance
router.get("/c_lb", authenticateJWT, getLeaveBalances);

// Get Time Off Download Report
router.get(
  "/c_downreport",
  authenticateJWT,
  validateSchema(getTimeOffDownloadReportSchema),
  getTimeOffDownloadReport,
);

// Get Time Tracking Report
router.get(
  "/c_downattendreport",
  authenticateJWT,
  validateSchema(getClientTrackTimeReportSchema),
  getClientTimeTrackingReport,
);

// Get Available Employees
router.get("/c_availemp", authenticateJWT, getAvailableEmployees);

export default router;
