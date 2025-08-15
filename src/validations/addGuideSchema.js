import * as yup from "yup";

export const addGuideSchema = yup.object({
    body: yup.object({
        guide_name: yup.string().required("Guide name is required"),
        language: yup.string().oneOf(["English", "Arabic"]).required("Language is required"),
        description: yup.string().optional(),
    })
})

export const deleteGuideSchema = yup.object({
    query: yup.object({
        id: yup.number().required("Guide ID is required"),
    })
})

export const updateGuideSchema = yup.object({
    query: yup.object({
        id: yup.number().required("Guide ID is required"),
    }),
    body: yup.object({
        guide_name: yup.string().optional(),
        language: yup.string().optional(),
        description: yup.string().optional(),
    })
})

export const downloadGuideSchema = yup.object({
    query: yup.object({
        id: yup.number().required("Guide ID is required"),
    })
})

export const updateGuideAssignmentSchema = yup.object({
    body: yup.object({
        data: yup.array().of(yup.object({
            id: yup.number().required("Guide ID is required"),
            employee: yup.boolean().required("Employee ID is required"),
            client: yup.boolean().required("Client ID is required"),
        })).required("Data is required"),
    })
})