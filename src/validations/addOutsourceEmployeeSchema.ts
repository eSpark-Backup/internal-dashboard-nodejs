import * as yup from "yup";

export const addOutsourceEmployeeSchema = yup.object({
  query: yup.object({
    c_email: yup
      .string()
      .email("Invalid client email")
      .required("Client email is required"),
  }),
  body: yup.object({
    id: yup.number().required("Employee ID is required"),
    country: yup.string().required("Country is required"),
    job_title: yup.string().required("Job title is required"),
    role_type: yup
      .string()
      .oneOf(
        ["Intern", "Junior", "Intermediate", "Senior"],
        "Invalid role type",
      )
      .required("Role type is required"),
    employment_term: yup
      .string()
      .oneOf(
        ["Salary based", "Hourly based", "Project based"],
        "Invalid employment term",
      )
      .required("Employment term is required"),
    joining_date: yup.date().required("Joining date is required"),
    salary: yup.number().required("Salary is required"),
    salary_currency: yup.string().required("Salary currency is required"),
  }),
});

export const getOutsourceEligibleEmployeesSchema = yup.object({
  query: yup.object({
    c_email: yup
      .string()
      .email("Valid client email is required")
      .required("Client email is required"),
  }),
});
