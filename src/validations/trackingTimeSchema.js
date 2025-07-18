import * as yup from "yup";

export const getClientTrackTimeSchema = yup.object({
  query: yup.object({
    emp_id: yup
      .string()
      .email("emp_id must be a valid email")
      .required("emp_id is required"),

    month: yup
      .string()
      .matches(/^[A-Za-z]+$/, "Month must be a valid month name")
      .optional(),

    year: yup
      .number()
      .typeError("Year must be a number")
      .optional(),
  }).test(
    "month-year-dependency",
    "Year is required when month is provided",
    function (values) {
      if (values.month && !values.year) {
        return this.createError({
          path: "year",
          message: "Year is required when month is provided",
        });
      }
      return true;
    }
  ),
});
