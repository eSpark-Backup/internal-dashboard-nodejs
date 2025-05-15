import * as yup from "yup";

export const updateLetterSchema = yup.object().shape({
  reason: yup.string().optional(),
});
