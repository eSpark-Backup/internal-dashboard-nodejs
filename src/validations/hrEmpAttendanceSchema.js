import * as yup from "yup";
import { parseISO, isValid } from "date-fns";
import { validateAndCleanTime } from "../helpers/utils.js";


const allowedStatuses = [
  "Absent",
  "Missing",
  "Day Off",
  "Full Leave",
  "Present",
  "Short Duration",
  "WFH",
];

export const getEmpAttendanceSchema = yup.object({
  query: yup.object({
    e_email: yup
      .string()
      .email("Invalid email format")
      .required("e_email is required"),

    from: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "From date must match YYYY-MM-DD format")
      .test("is-valid-date", "From date is not a valid date", (value) => !value || isValid(parseISO(value)))
      .notRequired(),

    to: yup
      .string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, "To date must match YYYY-MM-DD format")
      .test("is-valid-date", "To date is not a valid date", (value) => !value || isValid(parseISO(value)))
      .notRequired(),

    status: yup
      .string()
      .oneOf(allowedStatuses, "Invalid status")
      .notRequired(),

    checkInFrom: yup
      .string()
      .test("valid-checkInFrom", "Invalid checkInFrom time format", (value) => {
        if (!value) return true;
        try {
          validateAndCleanTime(value);
          return true;
        } catch (err) {
          return false;
        }
      })
      .notRequired(),

    checkInTo: yup
      .string()
      .test("valid-checkInTo", "Invalid checkInTo time format", (value) => {
        if (!value) return true;
        try {
          validateAndCleanTime(value);
          return true;
        } catch (err) {
          return false;
        }
      })
      .notRequired(),

    checkOutFrom: yup
      .string()
      .test("valid-checkOutFrom", "Invalid checkOutFrom time format", (value) => {
        if (!value) return true;
        try {
          validateAndCleanTime(value);
          return true;
        } catch (err) {
          return false;
        }
      })
      .notRequired(),

    checkOutTo: yup
      .string()
      .test("valid-checkOutTo", "Invalid checkOutTo time format", (value) => {
        if (!value) return true;
        try {
          validateAndCleanTime(value);
          return true;
        } catch (err) {
          return false;
        }
      })
      .notRequired(),
  }),
});
