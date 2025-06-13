import * as yup from "yup";

const addOffshoreContractSchema = yup.object({
  body: yup.object({
    client_id: yup
      .string()
      .trim()
      .required("client_id is required"),

    employee_id: yup
      .string()
      .trim()
      .required("employee_id is required"),

    contract_name: yup
      .string()
      .trim()
      .required("contract_name is required"),

    date: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .required("date is required"),
  }),
});

export default addOffshoreContractSchema;
