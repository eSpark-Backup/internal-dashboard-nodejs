export const checkClientDuplicates = (
    rows,
    { client_id, email }
  ) => {
    const duplicateErrors = {};
  
    for (const row of rows) {
      if (row.client_id === client_id) {
        duplicateErrors.client_id = [
          "Client with this client ID already exists.",
        ];
      }
      if (row.email === email) {
        duplicateErrors.email = ["Client with this email already exists."];
      }
    }
  
    return duplicateErrors;
  };
  