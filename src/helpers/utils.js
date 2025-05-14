import { format } from "date-fns";

const getFormattedTimestamp = () => {
    return format(new Date(), "MM-dd-yyyy_HH-mm-ss");
  };

export {getFormattedTimestamp}