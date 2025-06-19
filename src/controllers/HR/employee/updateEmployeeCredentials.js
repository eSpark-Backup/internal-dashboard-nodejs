import { logger } from "../../../helpers/logger.js";
import pool from "../../../config/db.js";
import bcrypt from "bcrypt";


const updateEmployeeCredentials = async (req, res) => {
    const { employee_id, current_password, new_password } = req.body || {};

    try {
        const employee = await pool.query("SELECT * FROM eSparkTalentAPI_employee WHERE employee_id = $1", [employee_id]);

        if (!employee.rows[0]) {
            return res.status(404).json({ message: "Employee with this id does not exist" });
        }

        const userExists = await pool.query("SELECT * FROM eSparkTalentAPI_end_user WHERE email = $1", [employee.rows[0].email]);

        if (!userExists.rows[0]) {
            return res.status(404).json({ message: "Employee with this email does not exist" });
        }

        const isPasswordCorrect = await bcrypt.compare(current_password, userExists.rows[0].password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        await pool.query("UPDATE eSparkTalentAPI_end_user SET password = $1 WHERE email = $2", [hashedNewPassword, employee.rows[0].email]);

        return res.status(200).json({ message: "Credentials have been updated" });

    } catch (error) {
        logger.error(`Error updating employee credentials: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    } 
}

export default updateEmployeeCredentials;
