import * as yup from "yup";

export const deleteEmployeeSchema = yup.object({
  query: yup.object({
    id: yup.string().required("Employee ID is required"),
  }),
});
