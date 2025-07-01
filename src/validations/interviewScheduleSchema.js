import * as yup from "yup";

export const addInterviewScheduleSchema = yup.object({
    body: yup.object({
        client_id: yup.string().email().required("Client ID is required"),
        employee_name: yup.string().required("Employee name is required"),
        job_title: yup.string().required("Job title is required"),
        interview_date_time: yup.date().required("Interview date time is required"),
        gender: yup.string().required("Gender is required"),
        role_type: yup.string().oneOf(["Intern", "Junior", "Intermediate", "Senior"]).required("Role type is required"),
        employment_term: yup.string().oneOf(["Salary based", "Hourly based", "Project based"]).required("Employment term is required"),
        country: yup.string().required("Country is required"),
    }),
});

export const getInterviewScheduleSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Client ID is required"),
    }),
});

export const updateInterviewScheduleSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Interview schedule ID is required"),
    }),
    body: yup.object({
        // client_id: yup.string().email().required("Client ID is required"),
        employee_name: yup.string().optional(),
        job_title: yup.string().optional(),
        interview_date_time: yup.date().optional(),
        gender: yup.string().optional(),
        role_type: yup.string().oneOf(["Intern", "Junior", "Intermediate", "Senior"]).optional(),
        employment_term: yup.string().oneOf(["Salary based", "Hourly based", "Project based"]).optional(),
        country: yup.string().optional(),
    })
    .test(
        "at-least-one-field",
        "At least one field must be provided in the request body",
        (value) => {
          return value && Object.values(value).some((v) => v !== undefined && v !== null && v !== "");
        }
      ),
});

export const deleteInterviewScheduleSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Interview schedule ID is required"),
    }),
});
