import * as yup from "yup";

export const getClientPunchRequestSchema = yup.object({
  query: yup.object({
    status: yup
      .string()
      .oneOf(["pending", "completed", "rejected", "all"])
      .required("Status is required"),
  }),
});
