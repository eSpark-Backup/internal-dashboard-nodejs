import * as yup from "yup";

export const getClientTeamSchema = yup.object({
  query: yup.object({
    status: yup
      .string()
      .oneOf(["active", "onboard", "terminated", "all"])
      .optional(),
  }),
});
