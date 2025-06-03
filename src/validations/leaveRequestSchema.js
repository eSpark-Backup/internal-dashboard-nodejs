import * as yup from "yup";

export const addLeaveRequestSchema = yup.object({
  body: yup.object({
    client_id: yup.string().required("Client ID is required"),
    leave_type: yup.string().required("Leave type is required"),
    start_date: yup.date().required("Start date is required"),
    end_date: yup
      .date()
      .min(yup.ref("start_date"), "End date must be after start date")
      .required("End date is required"),
    requested_at: yup.date().required("Requested at is required"),
    reason: yup.string().required("Reason is required"),
    count: yup
      .number()
      .min(1, "Minimum leave count is 1")
      .required("Leave count is required"),
  }),
});

export const deleteLeaveRequestSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Leave Request ID is required"),
  }),
});

export const getLeaveRequestSchema = yup.object({
  query: yup.object({
    workspace: yup.string().email().required(),
    tab: yup.string().oneOf(["pending", "completed", "rejected"]).notRequired(),
    from: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .notRequired(),
    to: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .notRequired(),
  }),
});


export const getEmployeeLeaveRequestsSchema = yup.object({
  query: yup.object({
    emp_email: yup.string().email("Invalid email").required("Employee email is required"),
  }),
});
