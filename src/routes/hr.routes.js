import express from "express";
import validateSchema from "../middleware/validate.js";
import { authenticateJWT } from "../middleware/auth.js";
import { upload } from "../helpers/multer.js";
import {
  addSalarySchema,
  deleteSalarySchema,
  downloadSalarySchema,
  getSalarySchema,
  updateSalarySchema,
} from "../validations/SalarySchema.js";
import {
  addLetterSchema,
  deleteLetterSchema,
  downloadLetterSchema,
  getLetterSchema,
  updateLetterSchema,
} from "../validations/letterSchema.js";
import {
  addEmployeeSchema,
  getEmployeeDetailsSchema,
  deleteEmployeeSchema,
  updateEmployeeProfilePictureSchema,
  updateEmployeeCredentialsSchema,
  downloadEmployeeResumeSchema,
} from "../validations/employeeSchema.js";
import {
  addAccountSchema,
  deleteAccountSchema,
  updateAccountSchema,
} from "../validations/accountSchema.js";
import addSalary from "../controllers/HR/Salary/addSalary.js";
import getSalary from "../controllers/HR/Salary/getSalary.js";
import deleteSalary from "../controllers/HR/Salary/deleteSalary.js";
import updateSalary from "../controllers/HR/Salary/updateSalary.js";
import getLettersByEmployeeEmail from "../controllers/HR/Letter/getEmployeeLetter.js";
import createLetter from "../controllers/HR/Letter/addLetter.js";
import updateLetter from "../controllers/HR/Letter/updateLetter.js";
import deleteLetter from "../controllers/HR/Letter/deleteLetter.js";
import addEmployee from "../controllers/HR/employee/addEmployee.js";
import getEmployeeDetails from "../controllers/HR/employee/GetEmployeeDetails.js";
import getEmployees from "../controllers/HR/employee/GetEmployees.js";
import deleteEmployee from "../controllers/HR/employee/deleteEmployee.js";
import hrHome from "../controllers/HR/Home/hrHome.js";
import {
  addBenefitSchema,
  deleteBenefitSchema,
  getBenefitSchema,
  updateBenefitSchema,
} from "../validations/benefitSchema.js";
import addBenefit from "../controllers/HR/Benefit/addBenefit.js";
import getBenefit from "../controllers/HR/Benefit/getBenefit.js";
import deleteBenefit from "../controllers/HR/Benefit/deleteBenefit.js";
import updateBenefit from "../controllers/HR/Benefit/updateBenefit.js";
import addAsset from "../controllers/HR/Asset/addAsset.js";
import {
  addAssetSchema,
  deleteAssetSchema,
  updateAssetSchema,
} from "../validations/assetSchema.js";
import updateAsset from "../controllers/HR/Asset/updateAsset.js";
import deleteAsset from "../controllers/HR/Asset/deleteAsset.js";
import addAccount from "../controllers/HR/Account/addAccount.js";
import getAccounts from "../controllers/HR/Account/getAccounts.js";
import deleteAccount from "../controllers/HR/Account/deleteAccount.js";
import updateAccount from "../controllers/HR/Account/updateAccount.js";
import getTimeAndLeave from "../controllers/HR/TimeAndLeave/getTimeAndLeave.js";
import updateTimeAndLeave from "../controllers/HR/TimeAndLeave/updateTimeAndLeave.js";
import { getTimeAndLeaveSchema } from "../validations/timeAndLeavesSchema.js";
import { validateEmpLeavesPatchSchema } from "../helpers/utils.js";
import { getEmployeePunchRequestsSchema } from "../validations/punchRequestsSchema.js";
import getEmployeePunchRequests from "../controllers/HR/PunchRequests/GetEmployeePunchRequests.js";
import {
  getEmployeeWFHRequestsSchema,
  updateEmployeeWFHRequestSchema,
} from "../validations/wfhRequestsSchema.js";
import getEmployeeWFHRequests from "../controllers/HR/WFHRequests/getEmployeeWFHRequests.js";
import updateEmployeeWFHRequest from "../controllers/HR/WFHRequests/updateEmployeeWFHRequest.js";
import updateEmployeeProfilePicture from "../controllers/HR/employee/updateEmployeeProfilePicture.js";
import updateEmployeeCredentials from "../controllers/HR/employee/updateEmployeeCredentials.js";
import getEmployeeResume from "../controllers/HR/employee/getEmployeeResume.js";
import { getEmployeeLeaveRequestsSchema } from "../validations/leaveRequestSchema.js";
import getEmployeeLeaveRequests from "../controllers/HR/LeaveRequests/getEmployeeLeaveRequests.js";
import {
  addPolicySchema,
  deletePolicySchema,
  downloadPolicySchema,
  updatePolicyAssignmentSchema,
  updatePolicySchema,
} from "../validations/policySchema.js";
import addPolicy from "../controllers/HR/Policy/addPolicy.js";
import getPolicy from "../controllers/HR/Policy/getPolicy.js";
import deletePolicy from "../controllers/HR/Policy/deletePolicy.js";
import updatePolicy from "../controllers/HR/Policy/updatePolicy.js";
import downloadPolicy from "../controllers/HR/Policy/downloadPolicy.js";
import updatePolicyAssignment from "../controllers/HR/Policy/updatePolicyAssignment.js";
import {
  addGuideSchema,
  deleteGuideSchema,
  downloadGuideSchema,
  updateGuideAssignmentSchema,
  updateGuideSchema,
} from "../validations/addGuideSchema.js";
import addGuide from "../controllers/HR/Guide/addGuide.js";
import getGuide from "../controllers/HR/Guide/getGuide.js";
import deleteGuide from "../controllers/HR/Guide/deleteGuide.js";
import updateGuide from "../controllers/HR/Guide/updateGuide.js";
import downloadGuide from "../controllers/HR/Guide/downloadGuide.js";
import updateGuideAssignment from "../controllers/HR/Guide/updateGuideAssignment.js";
import {
  addCompanyContractSchema,
  deleteCompanyContractSchema,
  downloadCompanyContractSchema,
  getCompanyContractSchema,
  updateCompanyContractSchema,
} from "../validations/companyContractSchema.js";
import addCompanyContract from "../controllers/HR/CompanyContract/addCompanyContract.js";
import getCompanyContracts from "../controllers/HR/CompanyContract/getCompanyContracts.js";
import deleteCompanyContract from "../controllers/HR/CompanyContract/deleteCompanyContract.js";
import updateCompanyContract from "../controllers/HR/CompanyContract/updateCompanyContract.js";
import downloadCompanyContract from "../controllers/HR/CompanyContract/downloadCompanyContract.js";
import { updateEmployeeInfoSchema } from "../validations/updateEmployeeInfoSchema.js";
import updateEmployeeInfo from "../controllers/HR/employee/updateEmployeeInfo.js";
import downloadLetter from "../controllers/HR/Letter/downloadLetter.js";
import {
  addOffshoreContractSchema,
  deleteOffshoreContractSchema,
  downloadOffshoreContractSchema,
  updateOffshoteContractSchema,
} from "../validations/addOffshoreContractSchema.js";
import addOffshoreContract from "../controllers/HR/OffShoreContract/addOffshoreContract.js";
import getOffshoreContracts from "../controllers/HR/OffShoreContract/getOffshoreContracts.js";
import deleteOffshoreContract from "../controllers/HR/OffShoreContract/deleteOffshoreContract.js";
import updateOffshoreContract from "../controllers/HR/OffShoreContract/updateOffshoreContract.js";
import downloadOffshoreContract from "../controllers/HR/OffShoreContract/downloadOffshoreContract.js";
import { getEmpAttendanceSchema } from "../validations/hrEmpAttendanceSchema.js";
import { getHrEmpAttendance } from "../controllers/HR/attendnaceReport/getHrEmpAttendance.js";
import downloadSalary from "../controllers/HR/Salary/downloadSalary.js";
import {
  addClientSchema,
  deleteClientSchema,
  getClientSchema,
  updateClientStatusSchema,
} from "../validations/clientSchema.js";
import addClient from "../controllers/HR/client/addClient.js";
import getClients from "../controllers/HR/client/getClients.js";
import updateClientStatus from "../controllers/HR/client/updateClientStatus.js";
import deleteClient from "../controllers/HR/client/deleteClient.js";
import {
  deleteStartHireSchema,
  downloadStartHireJDSchema,
  getHrStartHireSchema,
  hrStartHireSchema,
  updateStartHireSchema,
} from "../validations/hrStartHireSchema.js";
import addStartHire from "../controllers/HR/client/startHire/addStartHire.js";
import getStartHire from "../controllers/HR/client/startHire/getStartHire.js";
import updateStartHire from "../controllers/HR/client/startHire/updateStartHire.js";
import deleteStartHire from "../controllers/HR/client/startHire/deleteStartHire.js";
import downloadStartHireJD from "../controllers/HR/client/startHire/downloadStartHireJD.js";
import {
  addInterviewScheduleSchema,
  deleteInterviewScheduleSchema,
  getInterviewScheduleSchema,
  updateInterviewScheduleSchema,
} from "../validations/interviewScheduleSchema.js";
import addInterviewSchedule from "../controllers/HR/client/interviewSchedule/addInterviewSchedule.js";
import getInterviewSchedule from "../controllers/HR/client/interviewSchedule/getInterviewSchedule.js";
import updateInterviewSchedule from "../controllers/HR/client/interviewSchedule/updateInterviewSchedule.js";
import deleteInterviewSchedule from "../controllers/HR/client/interviewSchedule/deleteInterviewSchedule.js";
import { updateClientProfileSchema } from "../validations/clientSchema.js";
import updateClientProfile from "../controllers/HR/client/updateClientProfile.js";
import getClientProfile from "../controllers/HR/client/getClientProfile.js";

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
);

router.delete(
  "/hr_emps",
  authenticateJWT,
  validateSchema(deleteEmployeeSchema),
  deleteEmployee
);

router.patch(
  "/hr_update_empimg",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(updateEmployeeProfilePictureSchema),
  updateEmployeeProfilePicture
);

router.patch(
  "/hr_update_empcred",
  authenticateJWT,
  validateSchema(updateEmployeeCredentialsSchema),
  updateEmployeeCredentials
);

router.get(
  "/down_resume",
  authenticateJWT,
  validateSchema(downloadEmployeeResumeSchema),
  getEmployeeResume
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

router.get(
  "/down_payslip",
  authenticateJWT,
  validateSchema(downloadSalarySchema),
  downloadSalary
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

router.get(
  "/down_letter",
  authenticateJWT,
  validateSchema(downloadLetterSchema),
  downloadLetter
);

// Employee letter payment routes

// Employee Benefits Routes
router.post(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(addBenefitSchema),
  addBenefit
);

router.get(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(getBenefitSchema),
  getBenefit
);

router.delete(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(deleteBenefitSchema),
  deleteBenefit
);

router.patch(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(updateBenefitSchema),
  updateBenefit
);

// Employee Asset CRUD Routes

router.post(
  "/hr_add_asset",
  authenticateJWT,
  validateSchema(addAssetSchema),
  addAsset
);

router.delete(
  "/hr_add_asset",
  authenticateJWT,
  validateSchema(deleteAssetSchema),
  deleteAsset
);

router.patch(
  "/hr_add_asset",
  authenticateJWT,
  upload.none(),
  validateSchema(updateAssetSchema),
  updateAsset
);

// Employee Asset CRUD Routes

// Account CRUD Routes
router.post(
  "/hr_accounts",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(addAccountSchema),
  addAccount
);

router.get("/hr_accounts", authenticateJWT, getAccounts);

router.delete(
  "/hr_accounts",
  authenticateJWT,
  validateSchema(deleteAccountSchema),
  deleteAccount
);

router.patch(
  "/hr_accounts",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(updateAccountSchema),
  updateAccount
);

// Account CRUD Routes

// HR EMP Time and leaves Routes
router.get(
  "/hr_emp_t&l",
  authenticateJWT,
  validateSchema(getTimeAndLeaveSchema),
  getTimeAndLeave
);

router.patch(
  "/hr_emp_t&l",
  authenticateJWT,
  validateEmpLeavesPatchSchema,
  updateTimeAndLeave
);

// HR EMP Time and leaves Routes

// HR Employee Punch Requests Routes

router.get(
  "/hr_emp_pr",
  authenticateJWT,
  validateSchema(getEmployeePunchRequestsSchema),
  getEmployeePunchRequests
);

// HR Employee Punch Requests Routes

// Employee WFH Request Routes
router.get(
  "/hr_wfhr",
  authenticateJWT,
  validateSchema(getEmployeeWFHRequestsSchema),
  getEmployeeWFHRequests
);

router.patch(
  "/hr_wfhr",
  authenticateJWT,
  upload.none(),
  validateSchema(updateEmployeeWFHRequestSchema),
  updateEmployeeWFHRequest
);

// Employee WFH Request Routes

// Employee Leave Request Routes

router.get(
  "/hr_emp_lr",
  authenticateJWT,
  validateSchema(getEmployeeLeaveRequestsSchema),
  getEmployeeLeaveRequests
);

// Employee Leave Request Routes

// Policies CRUD Routes

router.post(
  "/hr_policy",
  authenticateJWT,
  upload.fields([{ name: "policy_doc", maxCount: 1 }]),
  validateSchema(addPolicySchema),
  addPolicy
);

router.get("/hr_policy", authenticateJWT, getPolicy);

router.delete(
  "/hr_policy",
  authenticateJWT,
  validateSchema(deletePolicySchema),
  deletePolicy
);

router.patch(
  "/hr_policy",
  authenticateJWT,
  upload.fields([{ name: "policy_doc", maxCount: 1 }]),
  validateSchema(updatePolicySchema),
  updatePolicy
);

router.get(
  "/down_policy",
  authenticateJWT,
  validateSchema(downloadPolicySchema),
  downloadPolicy
);

router.patch(
  "/hr_policy_edit",
  authenticateJWT,
  validateSchema(updatePolicyAssignmentSchema),
  updatePolicyAssignment
);

// Policies CRUD Routes

// Guides CRUD Routes

router.post(
  "/hr_guide",
  authenticateJWT,
  upload.fields([{ name: "guide_doc", maxCount: 1 }]),
  validateSchema(addGuideSchema),
  addGuide
);

router.get("/hr_guide", authenticateJWT, getGuide);

router.delete(
  "/hr_guide",
  authenticateJWT,
  validateSchema(deleteGuideSchema),
  deleteGuide
);

router.patch(
  "/hr_guide",
  authenticateJWT,
  upload.fields([{ name: "guide_doc", maxCount: 1 }]),
  validateSchema(updateGuideSchema),
  updateGuide
);

router.get(
  "/down_guide",
  authenticateJWT,
  validateSchema(downloadGuideSchema),
  downloadGuide
);

router.patch(
  "/hr_guide_edit",
  authenticateJWT,
  validateSchema(updateGuideAssignmentSchema),
  updateGuideAssignment
);

router.patch(
  "/hr_update_empinfo",
  authenticateJWT,
  validateSchema(updateEmployeeInfoSchema),
  updateEmployeeInfo
);

// Company Contracts Routes

router.post(
  "/hr_compcontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(addCompanyContractSchema),
  addCompanyContract
);

router.get(
  "/hr_compcontract",
  authenticateJWT,
  validateSchema(getCompanyContractSchema),
  getCompanyContracts
);

router.delete(
  "/hr_compcontract",
  authenticateJWT,
  validateSchema(deleteCompanyContractSchema),
  deleteCompanyContract
);

router.patch(
  "/hr_compcontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(updateCompanyContractSchema),
  updateCompanyContract
);

router.get(
  "/down_comp_cont",
  authenticateJWT,
  validateSchema(downloadCompanyContractSchema),
  downloadCompanyContract
);

// Employee Offshore Contracts Routes

router.post(
  "/hr_offscontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(addOffshoreContractSchema),
  addOffshoreContract
);

router.get("/hr_offscontract", authenticateJWT, getOffshoreContracts);

router.delete(
  "/hr_offscontract",
  authenticateJWT,
  validateSchema(deleteOffshoreContractSchema),
  deleteOffshoreContract
);

router.patch(
  "/hr_offscontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(updateOffshoteContractSchema),
  updateOffshoreContract
);

router.get(
  "/down_offshore",
  authenticateJWT,
  validateSchema(downloadOffshoreContractSchema),
  downloadOffshoreContract
);

router.get(
  "/hr_empattendance",
  authenticateJWT,
  validateSchema(getEmpAttendanceSchema),
  getHrEmpAttendance
);

//Client CRUD Routes

router.post(
  "/hr_add_client",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(addClientSchema),
  addClient
);

router.get("/hr_clients", authenticateJWT, getClients);

router.delete(
  "/hr_clients",
  authenticateJWT,
  validateSchema(deleteClientSchema),
  deleteClient
);

router.patch(
  "/hr_clients",
  authenticateJWT,
  validateSchema(updateClientStatusSchema),
  updateClientStatus
);

router.post(
  "/hr_start_hire/",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(hrStartHireSchema),
  addStartHire
);

router.get(
  "/hr_start_hire/",
  authenticateJWT,
  validateSchema(getHrStartHireSchema),
  getStartHire
);

router.patch(
  "/hr_start_hire/",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(updateStartHireSchema),
  updateStartHire
);

router.delete(
  "/hr_start_hire/",
  authenticateJWT,
  validateSchema(deleteStartHireSchema),
  deleteStartHire
);

router.get(
  "/down_jd/",
  authenticateJWT,
  validateSchema(downloadStartHireJDSchema),
  downloadStartHireJD
);
//Interview Schedule CRUD Routes

router.post(
  "/hr_is",
  authenticateJWT,
  validateSchema(addInterviewScheduleSchema),
  addInterviewSchedule
);

router.get(
  "/hr_is",
  authenticateJWT,
  validateSchema(getInterviewScheduleSchema),
  getInterviewSchedule
);

router.patch(
  "/hr_is",
  authenticateJWT,
  validateSchema(updateInterviewScheduleSchema),
  updateInterviewSchedule
);

router.delete(
  "/hr_is",
  authenticateJWT,
  validateSchema(deleteInterviewScheduleSchema),
  deleteInterviewSchedule
);

router.patch(
  "/hr_client_prof",
  authenticateJWT,
  upload.single("image"),
  validateSchema(updateClientProfileSchema),
  updateClientProfile
);

router.get(
  "/hr_client_prof",
  authenticateJWT,
  validateSchema(getClientSchema),
  getClientProfile
);

export default router;
