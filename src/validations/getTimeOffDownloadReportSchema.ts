import yup from "yup";

export const getTimeOffDownloadReportSchema = yup.object({
    query: yup.object({
      tab: yup.string().oneOf(["lr", "lb", "cio"]).required("Tab is required"),
    }),
  });
