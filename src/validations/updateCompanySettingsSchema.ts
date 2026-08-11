import * as yup from "yup";

export const patchCompanySettingsSchema = yup.object({
  body: yup.object({
    company_name: yup.string().optional(),
    company_email: yup.string().email("Invalid email format").optional(),
    website_url: yup.string().url("Invalid URL").optional(),
  }),
});
