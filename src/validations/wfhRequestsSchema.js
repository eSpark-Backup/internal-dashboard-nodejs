import * as yup from "yup";

export const createWFHRequestSchema = yup.object({
    body: yup.object({
        start_date: yup
            .date()
            .required("Start date is required"),
        end_date: yup
            .date()
            .required("End date is required"),
        reason: yup
            .string()
            .required("Reason is required"),
        count: yup
            .number()
            .required("Count is required")
            .positive("Count must be a positive number")
    }),
})

export const getWFHRequestSchema = yup.object({
    query: yup.object({
        tab: yup
            .string()
            .oneOf(["pending", "completed", "rejected"], "Invalid tab value")
            .optional("Tab is required"),
        from: yup
            .date()
            .optional("From date is optional"),
        to: yup
            .date()
            .optional("To date is optional"),
    }),
});

export const deleteWFHRequestSchema = yup.object({
    query: yup.object({
        id: yup.string().required("ID is required"),
    }),
});



// HR Employee WFH Requests Schema

export const getEmployeeWFHRequestsSchema = yup.object({
    query: yup.object({
        e_email: yup.string().email("Invalid email").required("Employee email is required"),
    }),
});

export const updateEmployeeWFHRequestSchema = yup.object({
    query: yup.object({
        id: yup.string().required("ID is required"),
    }),
    body: yup.object({
        status: yup.string().oneOf(["completed", "rejected"], "Invalid status value").required("Status is required"),
    }),
});





