import * as yup from "yup";

export const addLetterSchema = yup.object({
  body: yup.object({
    email: yup.string().email().required("Email is required"),
    objective: yup.string().required("Objective is required"),
    issue_date: yup.date().required("Issue date is required"),
    reason: yup.string().optional(),
  }),
});

export const updateLetterSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Letter ID is required"),
  }),
  body: yup.object({
    reason: yup.string().optional(),
    objective: yup.string().optional(),
    issue_date: yup.date().optional(),
  }),
});

export const deleteLetterSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Letter ID is required"),
  }),
});

export const getLetterSchema = yup.object({
  query: yup.object({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required 2"),
  }),
});

export const downloadLetterSchema = yup.object({
  query: yup.object({
      id: yup.string().required("Letter ID is required"),
  })
})