import * as yup from "yup";

export const getTimeAndLeaveSchema = yup.object({
  query: yup.object({
    id: yup.string().required("ID is required"),
    tab: yup
      .string()
      .oneOf(["time", "leaves"], "Tab must be either 'time' or 'leaves'")
      .required("Tab is required"),
  }),
});

const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

export const patchTimeSchema = yup.object({
  body: yup.object({
    check_in: yup
      .string()
      .matches(timeRegex, "Invalid time format (e.g., 12:02 PM)")
      .optional(),
    check_out: yup
      .string()
      .matches(timeRegex, "Invalid time format (e.g., 05:00 PM)")
      .optional(),
  }),
  query: yup.object({
    id: yup.string().required("ID is required"),
    tab: yup
      .string()
      .oneOf(["time"], "Tab must be 'time'")
      .required("Tab is required"),
  }),
});

const createLeaveTypeSchema = yup.object({
  total: yup
    .number()
    .min(0, "Leave total must be 0 or a positive number")
    .test("required-if-present", "Leave total is required", function (val) {
      return this.parent && Object.keys(this.parent).length === 0
        ? true
        : val !== undefined;
    }),
  availed: yup
    .number()
    .min(0, "Leave availed must be 0 or a positive number")
    .test("required-if-present", "Leave availed is required", function (val) {
      return this.parent && Object.keys(this.parent).length === 0
        ? true
        : val !== undefined;
    }),
  balance: yup
    .number()
    .min(0, "Leave balance must be 0 or a positive number")
    .test("required-if-present", "Leave balance is required", function (val) {
      return this.parent && Object.keys(this.parent).length === 0
        ? true
        : val !== undefined;
    }),
  status: yup
    .string()
    .oneOf(["enable", "disable"], "Status must be either 'enable' or 'disable'")
    .test("required-if-present", "Status is required", function (val) {
      return this.parent && Object.keys(this.parent).length === 0
        ? true
        : val !== undefined;
    }),
});

export const patchLeaveSchema = yup.object({
  body: yup
    .object({
      casual_leaves: createLeaveTypeSchema.notRequired(),
      sick_leaves: createLeaveTypeSchema.notRequired(),
      annual_leaves: createLeaveTypeSchema.notRequired(),
      unpaid_leaves: createLeaveTypeSchema.notRequired(),
      paid_leaves: createLeaveTypeSchema.notRequired(),
      hajj_leaves: createLeaveTypeSchema.notRequired(),
    })
    .noUnknown(true),
  query: yup.object({
    id: yup.string().required("ID is required"),
    tab: yup
      .string()
      .oneOf(["leaves"], "Tab must be 'leaves'")
      .required("Tab is required"),
  }),
});
