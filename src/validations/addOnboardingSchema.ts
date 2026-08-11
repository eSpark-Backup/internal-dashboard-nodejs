import * as yup from "yup";

export const addOnboardingSchema = yup.object({
    body: yup.object({
        employee_name: yup.string().required("Employee name is required"),
        client_id: yup.string().email().required("Client ID is required"),
        job_title: yup.string().required("Job title is required"),
        joining_date: yup.date().required("Interview date time is required"),
        notice_period: yup.string().required("Notice period is required"),
        salary: yup.string().required("Salary is required"),
        gender: yup.string().required("Gender is required"),
        role_type: yup.string().oneOf(["Intern", "Junior", "Intermediate", "Senior"]).required("Role type is required"),
        employment_term: yup.string().oneOf(["Salary based", "Hourly based", "Project based"]).required("Employment term is required"),
        country: yup.string().required("Country is required"),
        salary_currency: yup.string().required("Salary currency is required"),
    }),
});

export const getOnboardingSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Client ID is required"),
    }),
});

export const updateOnboardingSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Onboarding ID is required"),
    }),
    body: yup.object({
        // client_id: yup.string().email().required("Client ID is required"),
        employee_name: yup.string().optional(),
        client_id: yup.string().email().optional(),
        job_title: yup.string().optional(),
        joining_date: yup.date().optional(),
        notice_period: yup.string().optional(),
        salary: yup.string().optional(),
        gender: yup.string().optional(),
        role_type: yup.string().oneOf(["Intern", "Junior", "Intermediate", "Senior"]).optional(),
        employment_term: yup.string().oneOf(["Salary based", "Hourly based", "Project based"]).optional(),
        country: yup.string().optional(),
        salary_currency: yup.string().optional(),
    })
    .test(
        "at-least-one-field",
        "At least one field must be provided in the request body",
        (value) => {
          return value && Object.values(value).some((v) => v !== undefined && v !== null && v !== "");
        }
      ),
});

export const deleteOnboardingSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Onboarding ID is required"),
    }),
});
