import pool from "../../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../../helpers/logger.js";
import { validateFile } from "../../../../utils/validateFiles.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../../helpers/s3.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../../helpers/utils.js";

const addEmployeeInvoice = async (req, res) => {

    const { client_id, employee_id, invoice_date, due_date, currency, invoice_amount } = req.body || {};
    const invoice = req.files?.invoice?.[0] || null;
    let client;

    try {
        client = await pool.connect();

        const clientResult = await client.query(
            `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1 `,
            [client_id]
        );

        if (!clientResult.rows[0]?.id) {
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(404).json({ message: "Client does not exist with given client email" });
        }

        const employeeResult = await client.query(
            `SELECT id, first_name, last_name FROM eSparkTalentAPI_employee WHERE employee_id = $1 LIMIT 1`,
            [employee_id]
        );

        if (!employeeResult.rows[0]?.id) {
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(404).json({ message: "Employee does not exist with given employee id" });
        }

        const outsourceEmployeeResult = await client.query(
            `SELECT id FROM eSparkTalentAPI_outsource_employees WHERE employee_id = $1 AND client_id = $2 LIMIT 1`,
            [employeeResult.rows[0].id, clientResult.rows[0].id]
        );

        if (!outsourceEmployeeResult.rows[0]?.id) {
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(404).json({ message: "Employee is not associated with the client or was not found" });
        }

        if (outsourceEmployeeResult.rows[0]?.status === "terminated") {
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(400).json({ message: "Cannot create invoice for terminated employee" });
        }

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
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(400).json({ message: "Invalid file format or size", errors: fileErrors });
        }

        let invoiceUrl = null;

        try {
            if (invoice) {
                const timestamp = getFormattedTimestamp();
                const fileName = path.basename(invoice.originalname);
                const s3ImageKey = `${S3_TEMP_BUCKET}/invoices/employee_invoices/${timestamp}_${fileName}`;

                const fileContent = fs.readFileSync(invoice.path);
                await uploadToS3(s3ImageKey, fileContent, invoice.mimetype);
                await cleanupFiles([{ localPath: invoice?.path }]);

                invoiceUrl = s3ImageKey;
            }
        }
        catch (error) {
            logger.error(`Error uploading invoice: ${error.message}`);
            await cleanupFiles([{ localPath: invoice?.path }]);
            return res.status(500).json({ message: "Internal server error" });
        }

        await client.query("BEGIN");

        const invoiceResult = await client.query(
            `INSERT INTO eSparkTalentAPI_employee_invoice (client_id, employee_id, invoice_date, due_date, currency, invoice_amount, invoice, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [clientResult.rows[0].id, employeeResult.rows[0].id, invoice_date, due_date, currency, invoice_amount, invoiceUrl, "pending"]
        );

        if (!invoiceResult.rows[0]?.id) {
            await client.query("ROLLBACK");
            await cleanupFiles([{ localPath: invoice?.path, s3Path: invoiceUrl }]);
            return res.status(400).json({ message: "Failed to add invoice" });
        }

        const notification = await client.query(
            `INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [clientResult.rows[0].email, invoiceResult.rows[0].id, "employee_invoice", `Invoice is added for ${employeeResult.rows[0].first_name} ${employeeResult.rows[0].last_name}`, "added"]
        );

        if (!notification.rows[0]?.id) {
            await client.query("ROLLBACK");
            await cleanupFiles([{ localPath: invoice?.path, s3Path: invoiceUrl }]);
            return res.status(400).json({ message: "Failed to add notification" });
        }

        await client.query("COMMIT");

        return res.status(200).json({ message: `You have successfully added invoice for ${employeeResult.rows[0].first_name} ${employeeResult.rows[0].last_name}`, id: invoiceResult.rows[0].id });

    } catch (error) {
        logger.error(`Error adding invoice: ${error}`);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client) client.release();
    }


}

export default addEmployeeInvoice;