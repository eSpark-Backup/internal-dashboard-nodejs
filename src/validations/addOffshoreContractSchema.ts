import * as yup from "yup";

export const addOffshoreContractSchema = yup.object({
  body: yup.object({
    client_id: yup.string().trim().required("client_id is required"),

    employee_id: yup.string().trim().required("employee_id is required"),

    contract_name: yup.string().trim().required("contract_name is required"),

    date: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .required("date is required"),
  }),
});

export const deleteOffshoreContractSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
  }),
});

export const updateOffshoteContractSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Contract ID is required"),
  }),
  body: yup.object({
    contract_name: yup.string().optional(),
    date: yup.date().optional(),
    client_id: yup.string().optional(),
    employee_id: yup.string().optional(),
  }),
  files: yup.mixed().optional(),
});

export const downloadOffshoreContractSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
  }),
});

export const getEmpOffshoreContractsSchema = yup.object({
  query: yup.object({
    workspace: yup
      .string()
      .email("Invalid workspace email format")
      .required("workspace (client email) is required"),
  }),
});
