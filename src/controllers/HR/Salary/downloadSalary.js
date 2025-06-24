import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const downloadSalary = async (req, res) => {
    const { id } = req.query;

    try {
        const salary = await pool.query("SELECT * FROM eSparkTalentAPI_salary WHERE id = $1", [id]);

        if (!salary.rows[0]) {
            return res.status(404).json({ message: "Salary with this id does not exist" });
        }

        const paySlip = salary.rows[0].pay_slip;

        if (!paySlip) {
            return res.status(404).json({ message: "Pay slip not found" });
        }

        downloadFileFromS3(res, paySlip, `pay_slip.pdf`, "application/pdf");

    } catch (error) {
        logger.error(`Error getting pay slip: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default downloadSalary;
