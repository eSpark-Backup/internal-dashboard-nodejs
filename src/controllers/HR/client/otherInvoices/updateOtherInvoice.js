import pool from "../../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../../helpers/logger.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../../helpers/s3.js";
import { validateFile } from "../../../../utils/validateFiles.js";
import { cleanupFiles } from "../../../../helpers/utils.js";


const updateOtherInvoice = async (req, res) => {
    const { id } = req.query;
    const { invoice_reference, invoice_date, due_date, invoice_amount, payment_status, currency } = req.body || {};
    const invoice = req?.files?.invoice?.[0];

    try {
        const otherInvoice = await pool.query("SELECT id FROM eSparkTalentAPI_other_payment WHERE id = $1", [id]);

        if (otherInvoice.rowCount === 0) {
            return res.status(404).json({ message: "Invoice does not exist with given id" });
        }

        const invoiceReferenceResult = await pool.query("SELECT id FROM eSparkTalentAPI_other_payment WHERE invoice_reference = $1", [invoice_reference]);

        if (invoiceReferenceResult.rowCount > 0) {
            return res.status(400).json({ message: "invoice reference already exists should be unique" });
        }

        let invoiceUrl = otherInvoice.rows[0].invoice;

        try {
            if (invoice) {
                const fileErrors = {};
                const invoiceValidationErrors = validateFile({
                    file: invoice,
                    name: "invoice",
                    required: true,
                    allowedTypes: ["application/pdf"],
                    maxSizeMB: 5,
                });

                Object.assign(fileErrors, invoiceValidationErrors || {});

                if (Object.keys(fileErrors).length > 0) {
                    return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = path.basename(invoice.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/invoices/other_invoices/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(invoice.path);
                await uploadToS3(s3ImageKey, fileContent, invoice.mimetype);
                await cleanupFiles([{ localPath: invoice?.path }]);

                invoiceUrl = s3ImageKey;
            }
        } catch (error) {
            logger.error(`Error uploading invoice: ${error.message}`);
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(500).json({ message: "Internal server error" });
        }

        const updatedOtherInvoice = await pool.query(
            `UPDATE eSparkTalentAPI_other_payment
                SET invoice_reference = COALESCE($2, invoice_reference),
                    invoice_date    = COALESCE($3, invoice_date),
                    due_date        = COALESCE($4, due_date),
                    invoice_amount  = COALESCE($5, invoice_amount),
                    payment_status  = COALESCE($6, payment_status),
                    invoice         = COALESCE($7, invoice),
                    currency        = COALESCE($8, currency),
                    updated_at    = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, invoice_reference, invoice_date, due_date, invoice_amount, payment_status, invoiceUrl, currency]
        );

        if (updatedOtherInvoice.rowCount === 0) {
            await cleanupFiles([{ localPath: invoice?.path, s3Key: invoiceUrl }]);
            return res.status(400).json({ message: "Failed to update other invoice" });
        }

        return res.status(200).json({ message: "Other invoice updated successfully" });
    } catch (error) {
        logger.error(`Error updating other invoice: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateOtherInvoice
