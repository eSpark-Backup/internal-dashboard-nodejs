import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import {
  addLeaveRequestSchema,
  deleteLeaveRequestSchema,
  getLeaveRequestSchema,
} from "../validations/leaveRequestSchema.js";
import createLeaveRequest from "../controllers/employee/LeaveRequest/createLeaveRequest.js";
import deleteLeaveRequest from "../controllers/employee/LeaveRequest/deleteLeaveRequest.js";
import getLeaveRequest from "../controllers/employee/LeaveRequest/getLeaveRequest.js";
import {
  createWFHRequestSchema,
  deleteWFHRequestSchema,
  getWFHRequestSchema,
} from "../validations/wfhRequestsSchema.js";
import addWFHRequest from "../controllers/employee/WFHRequests/addWFHRequest.js";
import validateSchema from "../middleware/validate.js";
import { upload } from "../helpers/multer.js";
import getWFHRequests from "../controllers/employee/WFHRequests/getWFHRequests.js";
import deleteWFHRequest from "../controllers/employee/WFHRequests/deleteWFHRequest.js";
import {
  createPunchRequestSchema,
  deletePunchRequestSchema,
  getPunchRequestSchema,
} from "../validations/punchRequestsSchema.js";
import addPunchRequest from "../controllers/employee/PunchRequests/AddPunchRequest.js";
import getPunchRequests from "../controllers/employee/PunchRequests/getPunchRequests.js";
import deletePunchRequest from "../controllers/employee/PunchRequests/deletePunchRequest.js";
import getPolicies from "../controllers/employee/Policy/getPolicies.js";
import getGuides from "../controllers/employee/Guide/getGuides.js";
import getLetters from "../controllers/employee/Letter/getLetters.js";
import getBenefits from "../controllers/employee/Benefit/getBenefits.js";
import getCompanyContracts from "../controllers/employee/CompanyContracts/getCompanyContracts.js";
import { getHomeDetailsSchema, updateMarkAttendanceSchema } from "../validations/employeeSchema.js";
import getHomeDetails from "../controllers/employee/Home/getHomeDetails.js";
import updateMarkAttendance from "../controllers/employee/Home/updateMarkAttendance.js";
import getEmpOffshoreContracts from "../controllers/employee/OffshoreContracts/getEmpOffshoreContracts.js";
import { getEmpOffshoreContractsSchema } from "../validations/addOffshoreContractSchema.js";
import getNotifications from "../controllers/employee/Notifications/getNotifications.js";
import getTimeSheetDetails from "../controllers/employee/AttendanceSheet/getAttendanceSheet.js"

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

// Employee Leave Request Routes

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

// Employee Policy Routes

router.get("/emp_policies", authenticateJWT, getPolicies);

// Employee Guide Routes

router.get("/emp_guide", authenticateJWT, getGuides);

// Employee Benefits Routes

router.get(
  "/emp_benefits",
  authenticateJWT,
  getBenefits
);

// Employee Letters Routes
router.get(
  "/letters",
  authenticateJWT,
  getLetters
);

//Employee Company Contracts Routes

router.get("/emp_compcontract", authenticateJWT, getCompanyContracts);

//Employee offshore contracts route
router.get(
  "/emp_offshcontract",
  authenticateJWT,
  validateSchema(getEmpOffshoreContractsSchema),
  getEmpOffshoreContracts
);

// Notification Route
router.get(
  "/notify",
  authenticateJWT,
  getNotifications
)
//Employee Home Routes
router.get(
  "/emp_home",
  authenticateJWT,
  validateSchema(getHomeDetailsSchema),
  getHomeDetails
);

router.patch(
  "/emp_home",
  authenticateJWT,
  validateSchema(updateMarkAttendanceSchema),
  updateMarkAttendance
);

router.get(
  "/emp_timesheet",
  authenticateJWT,
  getTimeSheetDetails
);



export default router;
