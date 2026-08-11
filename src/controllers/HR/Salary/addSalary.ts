import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";


const addSalary = async (req, res) => {

    try {
        const { job_status, gross_salary, net_salary, date, tax_deduction } = req.body || {};
        const { employee_id } = req.query;
        const pay_slip = req?.files?.pay_slip?.[0];

        const employee = await pool.query(
            `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
            [employee_id]
        );

        if (!employee.rows[0]?.id) {
            return res.status(400).json({ message: "Employee does not exist with given employee email" });
        }

        const fileErrors = {};
        const paySlipValidationErrors = validateFile({
            file: pay_slip,
            name: "pay_slip",
            required: true,
            allowedTypes: ["application/pdf"],
            maxSizeMB: 5,
        });

        Object.assign(fileErrors, paySlipValidationErrors || {});

        if (Object.keys(fileErrors).length > 0) {
            await cleanupFiles([{ localPath: pay_slip?.path }]);
            return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
        }


        let paySlipUrl = null;

        try {
            if (pay_slip) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(pay_slip.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/employees/pay_slips/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(pay_slip.path);
                await uploadToS3(s3ImageKey, fileContent, pay_slip.mimetype);
                await cleanupFiles([{ localPath: pay_slip?.path }]);

                paySlipUrl = s3ImageKey;
            }
        } catch (error) {
            logger.error(`Error uploading pay slip: ${error.message}`);
            await cleanupFiles([{ localPath: pay_slip?.path }]);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const result = await pool.query(
            `INSERT INTO eSparkTalentAPI_salary (employee_id, date, gross_salary, tax_deduction, net_salary, pay_slip, job_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [employee.rows[0]?.id, date, gross_salary, tax_deduction, net_salary, paySlipUrl, job_status]
        );

        if (!result.rows[0].id) {
            await cleanupFiles([{ localPath: pay_slip?.path, s3Key: paySlipUrl }]);
            return res.status(400).json({
                message: "Failed to add salary",
            });
        }

        res.status(201).json({
            message: "Salary added successfully",
            id: result.rows[0].id,
        });


    } catch (error) {
        logger.error(`Error adding salary: ${error.message}`);
        res.status(500).json({
            message: "Error adding salary",
            error: error.message,
        });
    }
};

export default addSalary;
