import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const getEmployeeResume = async (req, res) => {
    const { id } = req.query;

    try {
        const employee = await pool.query("SELECT * FROM eSparkTalentAPI_employee WHERE id = $1", [id]);

        if (!employee.rows[0]) {
            return res.status(404).json({ message: "Employee with this id does not exist" });
        }

        const resume = employee.rows[0].resume;

        if (!resume) {
            return res.status(404).json({ message: "Employee resume not found" });
        }

        downloadFileFromS3(res, resume, `resume.pdf`, "application/pdf");

    } catch (error) {
        logger.error(`Error getting employee resume: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default getEmployeeResume;
