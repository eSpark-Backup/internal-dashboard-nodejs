import * as yup from "yup";

export const addClientSchema = yup.object({
    body: yup.object({
        first_name: yup.string().required("First name is required"),
        last_name: yup.string().required("Last name is required"),
        address: yup.string().required("Address is required"),
        client_id: yup.string().required("Client ID is required"),
        join_date: yup.date().required("Joining date is required"),
        phone_number: yup
            .string()
            .matches(/^\+?[0-9]{10,15}$/, "Invalid phone number")
            .required("Phone number is required"),
        email: yup
            .string()
            .email("Invalid email")
            .max(254, "Email must be ≤ 254 chars")
            .required("Email is required"),
        company_name: yup.string().required("Company name is required"),
        country: yup.string().required("Country is required"),
        password: yup
            .string()
            .min(8, "Password must be at least 8 characters")
            .required("Password is required"),
        confirm_password: yup
            .string()
            .oneOf([yup.ref("password")], "Passwords do not match")
            .required("Confirm password is required"),
    }),
});

export const updateClientStatusSchema = yup.object({
    query: yup.object({
      id: yup.string().required("Client ID is required"),
    }),
    body: yup.object({
        is_active: yup.boolean().required("Status is required"),
    }),
  });

export const deleteClientSchema = yup.object({
    query: yup.object({
      id: yup.string().required("Client ID is required"),
    }),
  });