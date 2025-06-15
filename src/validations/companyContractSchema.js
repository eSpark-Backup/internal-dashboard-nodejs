import * as yup from "yup";

export const addCompanyContractSchema = yup.object({
    query: yup.object({
      status: yup.string().oneOf(["client", "employee"]).required("Status is required"),
    }),
    body: yup.object({
      date: yup.date().required("Date is required"),
      contract_name: yup.string().required("Contract name is required"),
      employee_id: yup.string().when("$status", {
        is: "employee",
        then: (schema) => schema.required("Employee ID is required when status is employee"),
        otherwise: (schema) => schema.notRequired(),
      }),
      client_id: yup.string().when("$status", {
        is: "client",
        then: (schema) => schema.required("Client ID is required when status is client"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
  })

  export const updateCompanyContractSchema = yup.object({
    query: yup.object({
      id: yup.string().required("ID is required"),
      tab: yup.string().oneOf(["client", "employee"]).required("Tab is required"),
    }),
    body: yup.object({
      contract_name: yup.string().optional(),
      date: yup.date().optional(),
    }),
  })


  export const getCompanyContractSchema = yup.object({
    query: yup.object({
      status: yup.string().oneOf(["clients", "employees"]).required("Status is required"),
    }),
  })

  export const deleteCompanyContractSchema = yup.object({
    query: yup.object({
      id: yup.string().required("ID is required"),
      status: yup.string().oneOf(["clients", "employees"]).required("Status is required"),
    }),
  })

  export const downloadCompanyContractSchema = yup.object({
    query: yup.object({
      id: yup.string().required("ID is required"),
      tab: yup.string().oneOf(["client", "employee"]).required("Tab is required"),
    }),
  })
