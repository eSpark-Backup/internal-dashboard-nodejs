import * as yup from "yup";

const paymentInitiationSchema = yup.object({
  body: yup.object({
    invoiceId: yup
      .number()
      .typeError("Invoice ID must be a number")
      .integer("Invoice ID must be an integer")
      .positive("Invoice ID must be positive")
      .required("Invoice ID is required"),

    invoiceType: yup
      .string()
      .oneOf(
        ["SALARY", "CUSTOM"],
        "Invoice type must be either SALARY or CUSTOM",
      )
      .required("Invoice type is required"),
  }),
});

export default paymentInitiationSchema;
