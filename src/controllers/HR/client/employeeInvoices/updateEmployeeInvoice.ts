import pool from "../../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../../helpers/logger.js";
import { validateFile } from "../../../../utils/validateFiles.js";
import { S3_TEMP_BUCKET, uploadToS3 } from "../../../../helpers/s3.js";
import { cleanupFiles } from "../../../../helpers/utils.js";

const updateEmployeeInvoice = async (req, res) => {
  const { id } = req.query;
  const { invoice_date, due_date, invoice_amount, payment_status, currency } =
    req.body || {};
  const invoice = req?.files?.invoice?.[0];

  try {
    const employeeInvoice = await pool.query(
      "SELECT id FROM eSparkTalentAPI_employee_invoice WHERE id = $1",
      [id],
    );

    if (employeeInvoice.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Employee invoice not found with given id" });
    }

    if (employeeInvoice.rows[0].invoice_type === "SALARY") {
      return res
        .status(403)
        .json({ message: "Salary invoices cannot be updated manually" });
    }

    let invoiceUrl = employeeInvoice.rows[0].invoice;

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
          return res.status(400).json({
            message: "Invalid file format or size",
            errors: fileErrors,
          });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = path.basename(invoice.originalname);
        const s3ImageKey = `${S3_TEMP_BUCKET}/invoices/employee_invoices/${timestamp}_${fileName}`;

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

    const updatedEmployeeInvoice = await pool.query(
      `UPDATE eSparkTalentAPI_employee_invoice
                SET invoice_date    = COALESCE($2, invoice_date),
                    due_date        = COALESCE($3, due_date),
                    invoice_amount  = COALESCE($4, invoice_amount),
                    payment_status  = COALESCE($5, payment_status),
                    invoice         = COALESCE($6, invoice),
                    currency        = COALESCE($7, currency),
                    updated_at    = CURRENT_TIMESTAMP
             WHERE id = $1`,
      [
        id,
        invoice_date,
        due_date,
        invoice_amount,
        payment_status,
        invoiceUrl,
        currency,
      ],
    );

    if (updatedEmployeeInvoice.rowCount === 0) {
      await cleanupFiles([{ localPath: invoice?.path, s3Key: invoiceUrl }]);
      return res
        .status(400)
        .json({ message: "Failed to update employee invoice" });
    }

    return res
      .status(200)
      .json({ message: "Employee invoice updated successfully" });
  } catch (error) {
    logger.error(`Error updating employee invoice: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default updateEmployeeInvoice;
