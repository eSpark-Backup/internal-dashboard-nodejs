import * as yup from "yup";

export const addEmployeeInvoiceSchema = yup.object({
    body: yup.object({
        client_id: yup.string().email().required("Client ID is required"),
        employee_id: yup.string().required("Employee ID is required"),
        invoice_date: yup.date().required("Invoice date is required"),
        due_date: yup.date().required("Due date is required"),
        currency: yup.string().required("Currency is required"),
        invoice_amount: yup.number().required("Invoice amount is required"),
    }),
});

export const getEmployeeInvoicesSchema = yup.object({
    query: yup.object({
        client_id: yup.string().email().required("Client ID is required"),
        tab: yup
          .string()
          .oneOf(["pending", "processing", "paid", "under_review"])
          .optional(),
    }),
});

export const deleteEmployeeInvoiceSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Invoice ID is required"),
    }),
});

export const updateEmployeeInvoiceSchema = yup.object({
    query: yup.object({
      id: yup.string().required("ID is required"),
    }),
    body: yup.object({
      invoice_date: yup.date().optional(),
      due_date: yup.date().optional(),
      invoice_amount: yup.number().optional(),
      currency: yup.string().optional(),
      payment_status: yup.string().oneOf(["pending", "processing", "paid"]).optional(),
      
    }),
  })

export const downloadEmployeeInvoiceSchema = yup.object({
    query: yup.object({
      id: yup.string().required("Invoice ID is required"),
    }),
  });
