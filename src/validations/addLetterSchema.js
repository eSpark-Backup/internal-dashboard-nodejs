import * as yup from "yup";

export const addLetterSchema = yup.object().shape({
  email: yup.string().email().required("Email is required"),
  objective: yup.string().required("Objective is required"),
  issue_date: yup.date().required("Issue date is required"),
  reason: yup.string().optional(),
});
