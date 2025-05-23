import * as yup from "yup";

export const addBenefitSchema = yup.object({
    body: yup.object({
        card_id: yup.string().required("Card ID is required"),
        employee_id: yup.string().required("Employee ID is required"),
        benefit: yup.string().required("Benefit is required"),
        issue_date: yup.date().required("Issue date is required"),
        description: yup.string().required("Description is required"),
    }),
});

export const getBenefitSchema = yup.object({
    query: yup.object({
        emp_email: yup.string().required("Employee email is required"),
    }),
});

export const deleteBenefitSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Benefit ID is required"),
    }),
});

export const updateBenefitSchema = yup.object({
    query: yup.object({
        id: yup.string().required("Benefit ID is required"),
    }),
    body: yup.object({
        card_id: yup.string().required("Card ID is required"),
        description: yup.string().required("Description is required"),
    }),
});


