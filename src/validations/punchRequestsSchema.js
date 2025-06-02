import * as yup from "yup";


export const createPunchRequestSchema = yup.object({
    body: yup.object({
        date: yup.date().required("Date is required"),
        client_id: yup.string().email("Invalid email").required("Client ID is required"),
        punch_type: yup.string().oneOf(["check_in", "check_out"], "Invalid punch type").required("Punch type is required"),
        punch_time: yup.string().required("Punch time is required"),
        description: yup.string().required("Description is required"),
    }),
});

export const getPunchRequestSchema = yup.object({
    query: yup.object({
        workspace: yup.string().required("Workspace is required"),
        tab: yup.string().oneOf(["pending", "completed", "rejected"], "Invalid tab value").optional("Tab is required"),
        from: yup.date().optional("From date is optional"),
        to: yup.date().optional("To date is optional"),
    }),
});

export const deletePunchRequestSchema = yup.object({
    query: yup.object({
        id: yup.number().required("ID is required"),
    }),
});

export const getEmployeePunchRequestsSchema = yup.object({
    query: yup.object({
        emp_email: yup.string().email("Invalid email").required("Employee email is required"),
    }),
});

