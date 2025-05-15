import pool from "../../../config/db.js"

const deleteSalary = async (req, res) => {
    const { id } = req.query

    const salary = await pool.query("DELETE FROM eSparkTalentAPI_salary WHERE id = $1", [id])

    if (salary.rowCount === 0) {
        return res.status(404).json({ error: "Salary record not found" })
    }

    return res.status(200).json({ message: "Salary deleted successfully" })
}

export default deleteSalary 
