import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../../helpers/s3.js";

const downloadEmployeeInvoice = async (req, res) => {
  const { id } = req.query;

  try {
    const employeeInvoiceResult = await pool.query(
      "SELECT invoice FROM eSparkTalentAPI_employee_invoice WHERE id = $1",
      [id]
    );

    if (employeeInvoiceResult.rowCount === 0) {
      return res.status(404).json({ message: "Employee invoice not found" });
    }

    const invoice = employeeInvoiceResult.rows[0].invoice;

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    return downloadFileFromS3(
      res,
      invoice,
      "employee_invoice.pdf",
      "application/pdf"
    );
  } catch (error) {
    logger.error("Error downloading employee invoice:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default downloadEmployeeInvoice;
