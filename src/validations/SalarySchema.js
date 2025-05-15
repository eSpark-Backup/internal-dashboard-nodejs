import * as yup from "yup";

export const addSalarySchema = yup.object({
    body: yup.object({
        job_status: yup.string().required("Job status is required"),
        gross_salary: yup.number().required("Gross salary is required"),
        net_salary: yup.number().required("Net salary is required"),
        date: yup.date().required("Date is required"),
        tax_deduction: yup.number().required("Tax deduction is required"),
    }),
    query: yup.object({
        employee_id: yup.string().required("Employee ID is required"),
    }),
});

export const getSalarySchema = yup.object({
    query: yup.object({
        employee_id: yup.string().required("Employee ID is required"),
        month: yup.string().optional(),
        year: yup.string().optional(),
    }),
});

export const deleteSalarySchema = yup.object({
    query: yup.object({
        id: yup.string().required("Salary ID is required"),
    }),
});

export const updateSalarySchema = yup.object({
    query: yup.object({
        id: yup.string().required("Salary ID is required"),
    }),
    body: yup.object({
        job_status: yup.string().optional(),
        gross_salary: yup.number().optional(),
        net_salary: yup.number().optional(),
        date: yup.date().optional(),
        tax_deduction: yup.number().optional(),
    }),
});


