import * as yup from "yup";

export const hrClientEmpsPatchSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
  }),
  body: yup.object({
    status: yup
      .string()
      .oneOf(["active", "terminated"])
      .required("Status is required"),
  }),
});

export const validateHrClientEmpsGetSchema = yup.object({
  query: yup.object({
    c_email: yup.string().email("Invalid client email").required("Client email is required"),
    tab: yup.string().oneOf(["all", "active", "terminated"], "Invalid tab value").required("Tab is required"),
  }),
});