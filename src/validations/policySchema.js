import * as yup from "yup";

export const addPolicySchema = yup.object({
    body: yup.object({
        policy_name: yup.string().required("Policy name is required"),
    })
})

export const deletePolicySchema = yup.object({
    query: yup.object({
        id: yup.number().required("Policy ID is required"),
    })
})

export const updatePolicySchema = yup.object({
    query: yup.object({
        id: yup.number().required("Policy ID is required"),
    }),
    body: yup.object({
        policy_name: yup.string().optional(),
    })
})

export const downloadPolicySchema = yup.object({
    query: yup.object({
        id: yup.number().required("Policy ID is required"),
    })
})

export const updatePolicyAssignmentSchema = yup.object({
    body: yup.object({
        data: yup.array().of(yup.object({
            id: yup.number().required("Policy ID is required"),
            employee: yup.boolean().required("Employee ID is required"),
            client: yup.boolean().required("Client ID is required"),
        })).required("Data is required"),
    })
})
