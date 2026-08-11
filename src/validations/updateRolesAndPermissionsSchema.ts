import * as yup from "yup";

const permissionShape = yup
  .object({
    read: yup.boolean().optional(),
    write: yup.boolean().optional(),
    delete: yup.boolean().optional(),
    download: yup.boolean().optional(),
  })
  .noUnknown(true, "Only read, write, delete, download are allowed")
  .test(
    "at-least-one",
    "At least one permission (read, write, delete, download) is required",
    (value) => value && Object.keys(value).length > 0
  );

export const patchRolesAndPermissionsSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Record ID is required"),
  }),
  body: yup.object({
    employee_perms: permissionShape.required("employee_perms is required"),
    client_perms: permissionShape.required("client_perms is required"),
    leaves_perms: permissionShape.required("leaves_perms is required"),
    invoices_perms: permissionShape.required("invoices_perms is required"),
    policies_perms: permissionShape.required("policies_perms is required"),
    guides_perms: permissionShape.required("guides_perms is required"),
  }).noUnknown(true, "Only known permission groups are allowed"),
});
