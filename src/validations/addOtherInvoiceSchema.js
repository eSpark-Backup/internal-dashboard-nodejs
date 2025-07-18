import * as yup from "yup";

export const addOtherInvoiceSchema = yup.object({
  body: yup.object({
    client_id: yup.string().email().required("Client ID is required"),
    invoice_reference: yup.string().required("Invoice reference is required"),
    invoice_date: yup.date().required("Invoice date is required"),
    due_date: yup.date().required("Due date is required"),
    currency: yup.string().required("Currency is required"),
    invoice_amount: yup.number().required("Invoice amount is required"),
  }),
});

export const getOtherInvoicesSchema = yup.object({
  query: yup.object({
    client_id: yup.string().email().required("Client ID is required"),
    tab: yup.string().oneOf(["pending", "processing", "paid"]).optional(),
  }),
});

export const deleteOtherInvoiceSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Invoice ID is required"),
  }),
});

export const updateOtherInvoiceSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
  }),
  body: yup.object({
    invoice_reference: yup.string().optional(),
    invoice_date: yup.date().optional(),
    due_date: yup.date().optional(),
    invoice_amount: yup.number().optional(),
    currency: yup.string().optional(),
    payment_status: yup.string().oneOf(["pending", "processing", "paid"]).optional(),
  }),
})


export const downloadOtherInvoiceSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Invoice ID is required"),
  }),
});


export const getClientInvoicePaymentsSchema = yup.object({
  query: yup.object({
    payment_status: yup.string().oneOf(["pending", "processing", "paid"]).optional(),
  }),
});

export const updateInvoicePaymentStatusSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
  }),
  body: yup.object({
    category: yup.string().oneOf(["employee_invoices", "other_payment"]).required("Category is required"),
    payment_status: yup.string().oneOf(["pending", "processing", "paid"]).required("Payment status is required"),
  }),
});