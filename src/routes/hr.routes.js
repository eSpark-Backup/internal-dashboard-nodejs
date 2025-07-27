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
import {
  addOnboardingSchema,
  deleteOnboardingSchema,
  getOnboardingSchema,
  updateOnboardingSchema,
} from "../validations/addOnboardingSchema.js";
import addOnboarding from "../controllers/HR/client/onBoarding/addOnboarding.js";
import getOnboarding from "../controllers/HR/client/onBoarding/getOnboarding.js";
import deleteOnboarding from "../controllers/HR/client/onBoarding/deleteOnboarding.js";
import updateOnboarding from "../controllers/HR/client/onBoarding/updateOnboarding.js";
import {
  hrClientEmpsPatchSchema,
  validateHrClientEmpsGetSchema,
} from "../validations/hrClientEmpsSchema.js";
import updateHrClientEmps from "../controllers/HR/client/hrClientEmployees/updateHrClientEmps.js";
import getHrClientEmps from "../controllers/HR/client/hrClientEmployees/getHrClientEmps.js";
import {
  addEmployeeInvoiceSchema,
  deleteEmployeeInvoiceSchema,
  downloadEmployeeInvoiceSchema,
  getEmployeeInvoicesSchema,
  updateEmployeeInvoiceSchema,
} from "../validations/addEmployeeInvoiceSchema.js";
import addEmployeeInvoice from "../controllers/HR/client/employeeInvoices/addEmployeeInvoice.js";
import getEmployeeInvoices from "../controllers/HR/client/employeeInvoices/getEmployeeInvoices.js";
import deleteEmployeeInvoice from "../controllers/HR/client/employeeInvoices/deleteEmployeeInvoice.js";
import updateEmployeeInvoice from "../controllers/HR/client/employeeInvoices/updateEmployeeInvoice.js";
import downloadEmployeeInvoice from "../controllers/HR/client/employeeInvoices/downloadEmployeeInvoice.js";
import {
  addOtherInvoiceSchema,
  deleteOtherInvoiceSchema,
  downloadOtherInvoiceSchema,
  getOtherInvoicesSchema,
  updateOtherInvoiceSchema,
} from "../validations/addOtherInvoiceSchema.js";
import addOtherInvoice from "../controllers/HR/client/otherInvoices/addOtherInvoice.js";
import getOtherInvoices from "../controllers/HR/client/otherInvoices/getOtherInvoices.js";
import deleteOtherInvoice from "../controllers/HR/client/otherInvoices/deleteOtherInvoice.js";
import updateOtherInvoice from "../controllers/HR/client/otherInvoices/updateOtherInvoice.js";
import downloadOtherInvoice from "../controllers/HR/client/otherInvoices/downloadOtherInvoice.js";
import {
  addOutsourceEmployeeSchema,
  getOutsourceEligibleEmployeesSchema,
} from "../validations/addOutsourceEmployeeSchema.js";
import hrClientAddEmp from "../controllers/HR/client/hrClientAddEmp/hrClientAddEmp.js";
import getOutsourceEligibleEmployees from "../controllers/HR/client/hrClientAddEmp/getOutsourceEligibleEmployees.js";
import getRolesAndPermissions from "../controllers/HR/AccountAndPermissions/getRolesAndPermissions.js";
import { patchRolesAndPermissionsSchema } from "../validations/updateRolesAndPermissionsSchema.js";
import patchRolesAndPermissions from "../controllers/HR/AccountAndPermissions/updateRolesAndPermissions.js";
import { changePasswordSchema } from "../validations/changePasswordSchema.js";
import changePassword from "../controllers/HR/UpdatePassword/changePassword.js";
import getCompanySettings from "../controllers/HR/CompanySettings/getCompanySettings.js";
import { patchCompanySettingsSchema } from "../validations/updateCompanySettingsSchema.js";
import patchCompanySettings from "../controllers/HR/CompanySettings/updateCompanySettings.js";
import getInvoices from "../controllers/HR/Invoices/getInvoices.js";

const router = express.Router();

//HR Home Page
router.get(
  "/hr_home", 
  authenticateJWT, 
  hrHome
);

//Employee CRUD Routes
router.get(
  "/hr_emps", 
  authenticateJWT, 
  getEmployees
);

// Add Employee
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

// Get Employee Details
router.get(
  "/hr_emp_prof",
  authenticateJWT,
  validateSchema(getEmployeeDetailsSchema),
  getEmployeeDetails
);

// Delete Employee
router.delete(
  "/hr_emps",
  authenticateJWT,
  validateSchema(deleteEmployeeSchema),
  deleteEmployee
);

// Update Employee Profile Picture
router.patch(
  "/hr_update_empimg",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(updateEmployeeProfilePictureSchema),
  updateEmployeeProfilePicture
);

// Update Employee Credentials
router.patch(
  "/hr_update_empcred",
  authenticateJWT,
  validateSchema(updateEmployeeCredentialsSchema),
  updateEmployeeCredentials
);

// Download Employee Resume
router.get(
  "/down_resume",
  authenticateJWT,
  validateSchema(downloadEmployeeResumeSchema),
  getEmployeeResume
);


// Add Employee Salary
router.post(
  "/emp_salary",
  authenticateJWT,
  upload.fields([{ name: "pay_slip", maxCount: 1 }]),
  validateSchema(addSalarySchema),
  addSalary
);

// Get Employee Salary
router.get(
  "/emp_salary",
  authenticateJWT,
  validateSchema(getSalarySchema),
  getSalary
);

// Delete Employee Salary
router.delete(
  "/emp_salary",
  authenticateJWT,
  validateSchema(deleteSalarySchema),
  deleteSalary
);

// Update Employee Salary
router.patch(
  "/emp_salary",
  authenticateJWT,
  upload.fields([{ name: "pay_slip", maxCount: 1 }]),
  validateSchema(updateSalarySchema),
  updateSalary
);

// Download Employee Salary
router.get(
  "/down_payslip",
  authenticateJWT,
  validateSchema(downloadSalarySchema),
  downloadSalary
);

// Add Employee Letter
router.post(
  "/emp_letters",
  authenticateJWT,
  upload.fields([{ name: "letter", maxCount: 1 }]),
  validateSchema(addLetterSchema),
  createLetter
);

// Get Employee Letters
router.get(
  "/emp_letters",
  authenticateJWT,
  validateSchema(getLetterSchema),
  getLettersByEmployeeEmail
);

// Delete Employee Letter
router.delete(
  "/emp_letters",
  authenticateJWT,
  validateSchema(deleteLetterSchema),
  deleteLetter
);

// Update Employee Letter
router.patch(
  "/emp_letters",
  authenticateJWT,
  upload.single("letter"),
  validateSchema(updateLetterSchema),
  updateLetter
);

// Download Employee Letter
router.get(
  "/down_letter",
  authenticateJWT,
  validateSchema(downloadLetterSchema),
  downloadLetter
);

// Add Employee Benefit
router.post(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(addBenefitSchema),
  addBenefit
);

// Get Employee Benefits
router.get(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(getBenefitSchema),
  getBenefit
);

// Delete Employee Benefit
router.delete(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(deleteBenefitSchema),
  deleteBenefit
);

// Update Employee Benefit
router.patch(
  "/hr_emp_benefit",
  authenticateJWT,
  validateSchema(updateBenefitSchema),
  updateBenefit
);

// Add Employee Asset
router.post(
  "/hr_add_asset",
  authenticateJWT,
  validateSchema(addAssetSchema),
  addAsset
);

// Delete Employee Asset
router.delete(
  "/hr_add_asset",
  authenticateJWT,
  validateSchema(deleteAssetSchema),
  deleteAsset
);

// Update Employee Asset
router.patch(
  "/hr_add_asset",
  authenticateJWT,
  upload.none(),
  validateSchema(updateAssetSchema),
  updateAsset
);

// Add Account
router.post(
  "/hr_accounts",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(addAccountSchema),
  addAccount
);

// Get Accounts
router.get(
  "/hr_accounts", 
  authenticateJWT, 
  getAccounts
);

// Delete Account
router.delete(
  "/hr_accounts",
  authenticateJWT,
  validateSchema(deleteAccountSchema),
  deleteAccount
);

// Update Account
router.patch(
  "/hr_accounts",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(updateAccountSchema),
  updateAccount
);

// Get Time and Leave
router.get(
  "/hr_emp_t&l",
  authenticateJWT,
  validateSchema(getTimeAndLeaveSchema),
  getTimeAndLeave
);

// Update Time and Leave
router.patch(
  "/hr_emp_t&l",
  authenticateJWT,
  validateEmpLeavesPatchSchema,
  updateTimeAndLeave
);

// Get Employee Punch Requests
router.get(
  "/hr_emp_pr",
  authenticateJWT,
  validateSchema(getEmployeePunchRequestsSchema),
  getEmployeePunchRequests
);

// Get Employee WFH Requests
router.get(
  "/hr_wfhr",
  authenticateJWT,
  validateSchema(getEmployeeWFHRequestsSchema),
  getEmployeeWFHRequests
);

// Update Employee WFH Requests
router.patch(
  "/hr_wfhr",
  authenticateJWT,
  upload.none(),
  validateSchema(updateEmployeeWFHRequestSchema),
  updateEmployeeWFHRequest
);

// Get Employee Leave Requests
router.get(
  "/hr_emp_lr",
  authenticateJWT,
  validateSchema(getEmployeeLeaveRequestsSchema),
  getEmployeeLeaveRequests
);

// Add Policy
router.post(
  "/hr_policy",
  authenticateJWT,
  upload.fields([{ name: "policy_doc", maxCount: 1 }]),
  validateSchema(addPolicySchema),
  addPolicy
);

// Get Policy
router.get(
  "/hr_policy", 
  authenticateJWT, 
  getPolicy
);

// Delete Policy
router.delete(
  "/hr_policy",
  authenticateJWT,
  validateSchema(deletePolicySchema),
  deletePolicy
);

// Update Policy
router.patch(
  "/hr_policy",
  authenticateJWT,
  upload.fields([{ name: "policy_doc", maxCount: 1 }]),
  validateSchema(updatePolicySchema),
  updatePolicy
);

// Download Policy
router.get(
  "/down_policy",
  authenticateJWT,
  validateSchema(downloadPolicySchema),
  downloadPolicy
);

// Update Policy Assignment
router.patch(
  "/hr_policy_edit",
  authenticateJWT,
  validateSchema(updatePolicyAssignmentSchema),
  updatePolicyAssignment
);

// Add Guide
router.post(
  "/hr_guide",
  authenticateJWT,
  upload.fields([{ name: "guide_doc", maxCount: 1 }]),
  validateSchema(addGuideSchema),
  addGuide
);

// Get Guide
router.get(
  "/hr_guide",
  authenticateJWT,
  getGuide
);

// Delete Guide
router.delete(
  "/hr_guide",
  authenticateJWT,
  validateSchema(deleteGuideSchema),
  deleteGuide
);

// Update Guide
router.patch(
  "/hr_guide",
  authenticateJWT,
  upload.fields([{ name: "guide_doc", maxCount: 1 }]),
  validateSchema(updateGuideSchema),
  updateGuide
);

// Download Guide
router.get(
  "/down_guide",
  authenticateJWT,
  validateSchema(downloadGuideSchema),
  downloadGuide
);

// Update Guide Assignment
router.patch(
  "/hr_guide_edit",
  authenticateJWT,
  validateSchema(updateGuideAssignmentSchema),
  updateGuideAssignment
);

// Update Employee Info
router.patch(
  "/hr_update_empinfo",
  authenticateJWT,
  validateSchema(updateEmployeeInfoSchema),
  updateEmployeeInfo
);

// Add Company Contract
router.post(
  "/hr_compcontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(addCompanyContractSchema),
  addCompanyContract
);

// Get Company Contract
router.get(
  "/hr_compcontract",
  authenticateJWT,
  validateSchema(getCompanyContractSchema),
  getCompanyContracts
);

// Delete Company Contract
router.delete(
  "/hr_compcontract",
  authenticateJWT,
  validateSchema(deleteCompanyContractSchema),
  deleteCompanyContract
);

// Update Company Contract
router.patch(
  "/hr_compcontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(updateCompanyContractSchema),
  updateCompanyContract
);

// Download Company Contract
router.get(
  "/down_comp_cont",
  authenticateJWT,
  validateSchema(downloadCompanyContractSchema),
  downloadCompanyContract
);

// Add Offshore Contract
router.post(
  "/hr_offscontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(addOffshoreContractSchema),
  addOffshoreContract
);

// Get Offshore Contract
router.get(
  "/hr_offscontract", 
  authenticateJWT, 
  getOffshoreContracts
);

// Delete Offshore Contract
router.delete(
  "/hr_offscontract",
  authenticateJWT,
  validateSchema(deleteOffshoreContractSchema),
  deleteOffshoreContract
);

// Update Offshore Contract
router.patch(
  "/hr_offscontract",
  authenticateJWT,
  upload.fields([{ name: "contract_doc", maxCount: 1 }]),
  validateSchema(updateOffshoteContractSchema),
  updateOffshoreContract
);

// Download Offshore Contract
router.get(
  "/down_offshore",
  authenticateJWT,
  validateSchema(downloadOffshoreContractSchema),
  downloadOffshoreContract
);

// Get Employee Attendance
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

// Get Clients
router.get(
  "/hr_clients", 
  authenticateJWT, 
  getClients
);

// Delete Client
router.delete(
  "/hr_clients",
  authenticateJWT,
  validateSchema(deleteClientSchema),
  deleteClient
);

// Update Client Status
router.patch(
  "/hr_clients",
  authenticateJWT,
  validateSchema(updateClientStatusSchema),
  updateClientStatus
);

// Add Start Hire
router.post(
  "/hr_start_hire/",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(hrStartHireSchema),
  addStartHire
);

// Get Start Hire
router.get(
  "/hr_start_hire/",
  authenticateJWT,
  validateSchema(getHrStartHireSchema),
  getStartHire
);

// Delete Start Hire
router.delete(
  "/hr_start_hire/",
  authenticateJWT,
  validateSchema(deleteStartHireSchema),
  deleteStartHire
);

// Update Start Hire
router.patch(
  "/hr_start_hire/",
  authenticateJWT,
  upload.single("job_description"),
  validateSchema(updateStartHireSchema),
  updateStartHire
);

// Download Start Hire
router.get(
  "/down_jd/",
  authenticateJWT,
  validateSchema(downloadStartHireJDSchema),
  downloadStartHireJD
);

// Add Interview Schedule
router.post(
  "/hr_is",
  authenticateJWT,
  validateSchema(addInterviewScheduleSchema),
  addInterviewSchedule
);

// Get Interview Schedule
router.get(
  "/hr_is",
  authenticateJWT,
  validateSchema(getInterviewScheduleSchema),
  getInterviewSchedule
);

// Update Interview Schedule
router.patch(
  "/hr_is",
  authenticateJWT,
  upload.none(),
  validateSchema(updateInterviewScheduleSchema),
  updateInterviewSchedule
);

// Delete Interview Schedule
router.delete(
  "/hr_is",
  authenticateJWT,
  validateSchema(deleteInterviewScheduleSchema),
  deleteInterviewSchedule
);

// Update Client Profile
router.patch(
  "/hr_client_prof",
  authenticateJWT,
  upload.single("image"),
  validateSchema(updateClientProfileSchema),
  updateClientProfile
);

// Get Client Profile
router.get(
  "/hr_client_prof",
  authenticateJWT,
  validateSchema(getClientSchema),
  getClientProfile
);

// Add Onboarding
router.post(
  "/hr_onboarding",
  authenticateJWT,
  validateSchema(addOnboardingSchema),
  addOnboarding
);

// Get Onboarding
router.get(
  "/hr_onboarding",
  authenticateJWT,
  validateSchema(getOnboardingSchema),
  getOnboarding
);

// Delete Onboarding
router.delete(
  "/hr_onboarding",
  authenticateJWT,
  validateSchema(deleteOnboardingSchema),
  deleteOnboarding
);

// Update Onboarding
router.patch(
  "/hr_onboarding",
  authenticateJWT,
  upload.none(),
  validateSchema(updateOnboardingSchema),
  updateOnboarding
);

// Get Client Employees
router.get(
  "/hr_clientemps",
  authenticateJWT,
  validateSchema(validateHrClientEmpsGetSchema),
  getHrClientEmps
);

// Update Client Employees
router.patch(
  "/hr_clientemps",
  authenticateJWT,
  validateSchema(hrClientEmpsPatchSchema),
  updateHrClientEmps
);

// Add Employee Invoice
router.post(
  "/hr_empinv",
  authenticateJWT,
  upload.fields([{ name: "invoice", maxCount: 1 }]),
  validateSchema(addEmployeeInvoiceSchema),
  addEmployeeInvoice
);

// Get Employee Invoices
router.get(
  "/hr_empinv",
  authenticateJWT,
  validateSchema(getEmployeeInvoicesSchema),
  getEmployeeInvoices
);

// Delete Employee Invoice
router.delete(
  "/hr_empinv",
  authenticateJWT,
  validateSchema(deleteEmployeeInvoiceSchema),
  deleteEmployeeInvoice
);

// Update Employee Invoice
router.patch(
  "/hr_empinv",
  authenticateJWT,
  upload.fields([{ name: "invoice", maxCount: 1 }]),
  validateSchema(updateEmployeeInvoiceSchema),
  updateEmployeeInvoice
);

// Download Employee Invoice
router.get(
  "/down_emp_inv",
  authenticateJWT,
  validateSchema(downloadEmployeeInvoiceSchema),
  downloadEmployeeInvoice
);

// Add Other Invoice
router.post(
  "/hr_otherinv",
  authenticateJWT,
  upload.fields([{ name: "invoice", maxCount: 1 }]),
  validateSchema(addOtherInvoiceSchema),
  addOtherInvoice
);

// Get Other Invoices
router.get(
  "/hr_otherinv",
  authenticateJWT,
  validateSchema(getOtherInvoicesSchema),
  getOtherInvoices
);

// Delete Other Invoice
router.delete(
  "/hr_otherinv",
  authenticateJWT,
  validateSchema(deleteOtherInvoiceSchema),
  deleteOtherInvoice
);

// Update Other Invoice
router.patch(
  "/hr_otherinv",
  authenticateJWT,
  upload.fields([{ name: "invoice", maxCount: 1 }]),
  validateSchema(updateOtherInvoiceSchema),
  updateOtherInvoice
);

// Download Other Invoice
router.get(
  "/down_oth_inv",
  authenticateJWT,
  validateSchema(downloadOtherInvoiceSchema),
  downloadOtherInvoice
);

// Get Invoices
router.get(
  "/hr_invoices",
  authenticateJWT,
  getInvoices
);

// Add Outsource Employee
router.post(
  "/hr_clientaddemp",
  authenticateJWT,
  validateSchema(addOutsourceEmployeeSchema),
  hrClientAddEmp
);

// Get Outsource Eligible Employees
router.get(
  "/hr_clientaddemp",
  authenticateJWT,
  validateSchema(getOutsourceEligibleEmployeesSchema),
  getOutsourceEligibleEmployees
);

// Get Roles and Permissions
router.get(
  "/hr_rnp",
  authenticateJWT,
  getRolesAndPermissions
);

// Update Roles and Permissions
router.patch(
  "/hr_rnp",
  authenticateJWT,
  validateSchema(patchRolesAndPermissionsSchema),
  patchRolesAndPermissions
);

// Change Password
router.patch(
  "/hr_changepass",
  authenticateJWT,
  upload.none(),
  validateSchema(changePasswordSchema),
  changePassword
);

// Get Company Settings
router.get(
  "/hr_compsett",
  authenticateJWT,
  getCompanySettings
);

// Update Company Settings
router.patch(
  "/hr_compsett",
  authenticateJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateSchema(patchCompanySettingsSchema),
  patchCompanySettings
);

export default router;
