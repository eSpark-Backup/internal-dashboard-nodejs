import * as yup from "yup";

export const hrStartHireSchema = yup.object({
  body: yup.object({
    client_id: yup.string().email().required("Client ID is required"),
    job_title: yup.string().required("Job title is required"),
    role_type: yup
      .string()
      .oneOf(["Intern", "Junior", "Intermediate", "Senior"])
      .required("Role type is required"),
    gender: yup.string().required("Gender is required"),
    employment_term: yup
      .string()
      .oneOf(["Salary based", "Hourly based", "Project based"])
      .required("Employment term is required"),
    // salary_range: yup
    //   .object({
    //     minimum: yup.string().required("Minimum salary required"),
    //     maximum: yup.string().required("Maximum salary required"),
    //   })
    //   .required("Salary range is required"),
    salary_range: yup
      .mixed()
      .transform((value, originalValue) => {
        // If value is already an object, keep it
        if (typeof originalValue === "object") return originalValue;

        // Try parsing if it's a string
        try {
          return JSON.parse(originalValue);
        } catch {
          return {}; // Force schema validation to catch invalid format
        }
      })
      .test(
        "is-valid-salary-range",
        "Salary range must have minimum and maximum",
        (value) => {
          return (
            value &&
            typeof value.minimum === "string" &&
            typeof value.maximum === "string"
          );
        }
      )
      .required("Salary range is required"),
    salary_currency: yup.string().required("Salary currency is required"),
    country: yup.string().required("Country is required"),
    hiring_start_date: yup.date().required("Hiring start date is required"),
    hiring_end_date: yup.date().required("Hiring end date is required"),
    comments: yup.string().nullable(),
  }),
});
