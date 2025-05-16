import pool from "../../../config/db.js";
import { validateFile } from "../../../utils/validateFiles.js";
import { logger } from "../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../helpers/s3.js";
import path from "path";
import fs from "fs";


const updateSalary = async (req, res) => {
    const { id } = req.query;
    const { job_status, gross_salary, net_salary, date, tax_deduction } = req.body || {};
    const pay_slip = req?.files?.pay_slip?.[0];

    try {
        const salary = await pool.query("SELECT id, job_status, gross_salary, tax_deduction, net_salary, TO_CHAR(date, 'YYYY-MM-DD') as date FROM eSparkTalentAPI_salary WHERE id = $1", [id]);

        if (salary.rowCount === 0) {
            return res.status(404).json({ message: "Salary not found with given id" });
        }

        let paySlipUrl = salary.rows[0].pay_slip;

        if (pay_slip) {
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
                return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = path.basename(pay_slip.originalname);
            const s3ImageKey = `${S3_TEMP_BUCKET}/employees/pay_slips/${timestamp}_${fileName}`;

            const fileContent = fs.readFileSync(pay_slip.path);
            await uploadToS3(s3ImageKey, fileContent, pay_slip.mimetype);
            fs.unlinkSync(pay_slip.path);

            paySlipUrl = s3ImageKey;
        }

        const updatedSalary = await pool.query(
            `UPDATE eSparkTalentAPI_salary
                SET job_status    = COALESCE($2, job_status),
                    gross_salary  = COALESCE($3, gross_salary),
                    net_salary    = COALESCE($4, net_salary),
                    date          = COALESCE($5, date),
                    tax_deduction = COALESCE($6, tax_deduction),
                    pay_slip      = COALESCE($7, pay_slip),
                    updated_at    = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, job_status, gross_salary, net_salary, date, tax_deduction, paySlipUrl]
        );

        if (updatedSalary.rowCount === 0) {
            return res.status(400).json({ message: "Failed to update salary" });
        }

        return res.status(200).json({ message: "Salary updated successfully" });
    } catch (error) {
        logger.error(`Error updating salary: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateSalary
