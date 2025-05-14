export const checkEmployeeDuplicates = (
  rows,
  { employee_id, email, personal_email }
) => {
  const duplicateErrors = {};

  for (const row of rows) {
    if (row.employee_id === employee_id) {
      duplicateErrors.employee_id = [
        "Employee with this employee ID already exists.",
      ];
    }
    if (row.email === email) {
      duplicateErrors.email = ["Employee with this email already exists."];
    }
    if (row.personal_email === personal_email) {
      duplicateErrors.personal_email = [
        "Employee with this personal email already exists.",
      ];
    }
  }

  return duplicateErrors;
};
