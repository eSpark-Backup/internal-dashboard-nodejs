import * as yup from "yup";

export const addAccountSchema = yup.object({
    body: yup.object({
        account_name: yup.string().required("Account name is required"),
        email: yup.string().email("Invalid email").required("Email is required"),
        password: yup.string().required("Password is required"),
        confirm_password: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
    }),
});

export const deleteAccountSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Account ID is required"),
      }),
});

export const updateAccountSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Account ID is required"),
    }),
    body: yup.object({
        account_name: yup.string().optional(),
        email: yup.string().email("Invalid email").optional(),
        password: yup.string().optional(),
    }),
});
