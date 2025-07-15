import * as yup from "yup";

export const updateCompanyNameSchema = yup.object({
  body: yup.object({
    company_name: yup.string().required("Company name is required"),
  }),
});
