import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"

const deleteSalary = async (req, res) => {
    const { id } = req.query

    const salary = await pool.query("DELETE FROM eSparkTalentAPI_salary WHERE id = $1", [id])

    if (salary.rowCount === 0) {
        return res.status(404).json({ message: "Salary record not found" })
    }
     
    logger.info(`Salary deleted successfully: ${id}`)
    return res.status(200).json({ message: "Salary deleted successfully" })
}

export default deleteSalary 
