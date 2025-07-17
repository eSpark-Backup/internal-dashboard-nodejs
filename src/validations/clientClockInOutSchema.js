import * as yup from "yup";

export const getClientPunchRequestSchema = yup.object({
  query: yup.object({
    status: yup
      .string()
      .oneOf(["pending", "completed", "rejected", "all"])
      .required("Status is required"),
  }),
});

export const updateClientPunchRequestSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Request ID is required"),
  }),
  body: yup.object({
    status: yup
      .string()
      .oneOf(["completed", "rejected"], "Invalid status value")
      .required("Status is required"),
  }),
});