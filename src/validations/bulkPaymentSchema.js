import * as yup from "yup";

const bulkPaymentSchema = yup.object({
  body: yup.object({
    invoiceIds: yup
      .array()
      .of(
        yup
          .number()
          .typeError("Invoice IDs must be numbers")
          .integer("Invoice IDs must be integers")
          .positive("Invoice IDs must be positive"),
      )
      .min(2, "At least 2 invoices required for bulk payment")
      .max(50, "Maximum 50 invoices allowed per bulk payment")
      .required("Invoice IDs are required"),

    invoiceType: yup
      .string()
      .oneOf(
        ["SALARY", "CUSTOM"],
        "Invoice type must be either SALARY or CUSTOM",
      )
      .required("Invoice type is required"),
  }),
});

export default bulkPaymentSchema;
