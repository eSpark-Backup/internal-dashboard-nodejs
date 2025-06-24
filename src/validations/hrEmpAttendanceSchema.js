import * as yup from "yup";
import { parseISO, isValid } from "date-fns";

export const getEmpAttendanceSchema = yup.object({
  query: yup.object({
    e_email: yup
      .string()
      .email("Invalid email format")
      .required("e_email is required"),

    from: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "From date must match YYYY-MM-DD format")
      .test(
        "is-valid-date",
        "From date is not a valid date",
        (value) => !value || isValid(parseISO(value))
      )
      .notRequired(),

    to: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "To date must match YYYY-MM-DD format")
      .test(
        "is-valid-date",
        "To date is not a valid date",
        (value) => !value || isValid(parseISO(value))
      )
      .notRequired(),
  }),
});
