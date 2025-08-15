import * as yup from "yup";

export const updateEmployeeInfoSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
  }),

  body: yup
    .object()
    .shape({
      first_name: yup.string(),
      last_name: yup.string(),
      dob: yup.date().typeError("Invalid date format"),
      gender: yup.string().oneOf(["Male", "Female", "Other"]),
      personal_email: yup.string().email(),
      marital_status: yup.string(),
      phone_number: yup.string(),
      joining_date: yup.date().typeError("Invalid date format"),

      employee_id: yup.string(),
      job_title: yup.string(),
      role: yup.string(),
      job_status: yup.string(),
      starting_date: yup.date().typeError("Invalid date format"),
      ending_date: yup.date().typeError("Invalid date format"),

      emergency_contact: yup
        .object({
          primary: yup.object({
            name: yup.string(),
            relation: yup.string(),
            phone_number: yup.string(),
            phone_number2: yup.string(),
          }),
          secondary: yup.object({
            name: yup.string(),
            relation: yup.string(),
            phone_number: yup.string(),
            phone_number2: yup.string(),
          }),
        })
        .optional(),

      email: yup
        .mixed()
        .notRequired()
        .test({
          name: "not-allowed",
          message: "Email field cannot be edited",
          test: (value) => value === undefined,
        }),
    })
    .noUnknown(true, "Unknown fields are not allowed in the request body"),
});
