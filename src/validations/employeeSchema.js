import * as yup from "yup";

export const addEmployeeSchema = yup.object({
  body: yup.object({
    employee_id: yup.string().required("Employee ID is required"),
    first_name: yup.string().required("First name is required"),
    last_name: yup.string().required("Last name is required"),
    gender: yup.string().required("Gender is required"),
    dob: yup
      .date()
      .max(new Date(), "Date of birth must be in the past")
      .required("Date of birth is required"),
    email: yup
      .string()
      .email("Invalid email")
      .max(254, "Email must be ≤ 254 chars")
      .required("Email is required"),
    personal_email: yup
      .string()
      .email("Invalid personal email")
      .required("Personal email is required"),
    marital_status: yup.string().required("Marital status is required"),
    emergency_contact: yup.string().required("Emergency contact is required"),
    joining_date: yup.date().required("Joining date is required"),
    role: yup.string().required("Role is required"),
    job_title: yup.string().required("Job title is required"),
    company: yup.string().required("Company is required"),
    punch_timings: yup.string().required("Punch timings are required"),
    job_status: yup.string().required("Job status is required"),
    starting_date: yup.date().nullable().notRequired(),
    ending_date: yup
      .date()
      .min(yup.ref("joining_date"), "End date must be after joining date")
      .nullable(),
    phone_number: yup
      .string()
      .matches(/^\+?[0-9]{10,15}$/, "Invalid phone number")
      .required("Phone number is required"),
    casual_leaves: yup.number().required("Casual leaves are required"),
    sick_leaves: yup.number().required("Sick leaves are required"),
    annual_leaves: yup.number().required("Annual leaves are required"),
    hajj_leaves: yup.number().required("Hajj leaves are required"),
    paid_leaves: yup.number().required("Paid leaves are required"),
    unpaid_leaves: yup.number().required("Unpaid leaves are required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords do not match")
      .required("Confirm password is required"),
  }),
});

export const getEmployeeDetailsSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
    tab: yup.string().optional(),
  }),
});

export const deleteEmployeeSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
  }),
});

export const updateEmployeeProfilePictureSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
  }),
});

export const updateEmployeeCredentialsSchema = yup.object({
   body: yup.object({
    employee_id: yup.string().required("Employee ID is required"),
    current_password: yup.string().required("Current password is required"),
    new_password: yup.string().required("New password is required"),
    confirm_password: yup.string().required("Confirm password is required")
    .oneOf([yup.ref("new_password")], "Passwords do not match")
   })
});

export const downloadEmployeeResumeSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
  }),
});

