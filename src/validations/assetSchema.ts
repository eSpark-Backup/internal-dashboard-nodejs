import * as yup from "yup";

export const addAssetSchema = yup.object({
  body: yup.object({
    asset_id: yup.string().required("Asset ID is required"),
    employee_id: yup
      .string()
      .email("Employee ID must be a valid email address")
      .required("Employee ID is required"),
    gadget: yup.string().required("Gadget is required"),
    assigned_date: yup.date().required("Assigned date is required"),
    assignee_name: yup.string().required("Assignee name is required"),
    assignee_email: yup
      .string()
      .email("Invalid email format")
      .required("Assignee email is required"),
  }),
});

export const updateAssetSchema = yup.object({
  query: yup.object({
    id: yup
      .string()
      .matches(/^[0-9]+$/, "Asset ID must be a numeric string")
      .required("Asset ID (query) is required"),
  }),
  body: yup.object({
    asset_id: yup.string().optional(),
    employee_id: yup
      .string()
      .email("Employee ID must be a valid email address")
      .optional(),
    gadget: yup.string().optional(),
    assigned_date: yup.date().optional(),
    assignee_name: yup.string().optional(),
    assignee_email: yup.string().email("Invalid email").optional(),
  }),
});

export const deleteAssetSchema = yup.object({
  query: yup.object({
    id: yup
      .string()
      .matches(/^[0-9]+$/, "Asset ID must be a numeric string")
      .required("Asset ID (query) is required"),
  }),
});
