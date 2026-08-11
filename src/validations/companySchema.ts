import * as yup from "yup";

export const updateCompanyNameSchema = yup.object({
  body: yup.object({
    company_name: yup.string().required("Company name is required"),
  }),
});

export const updateClientPasswordSchema = yup.object({
  body: yup.object({
    current_password: yup.string().required("Current password is required"),
    new_password: yup.string().required("New password is required"),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("new_password")], "Passwords must match")
      .required("Confirm password is required"),
  }),
});