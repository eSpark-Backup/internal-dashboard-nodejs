import pool from "../../../config/db.js"
import { MONTHS } from "../../../constants/index.js"
import { logger } from "../../../helpers/logger.js"

const getSalary = async (req, res) => {
    const { employee_id, month, year } = req.query

    try {
        const employee = await pool.query(
            `SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`,
            [employee_id]
        );
    
        if (!employee.rows[0]?.id) {
            return res.status(400).json({ message: "Employee does not exist with given employee email" });
        }


        let query = `SELECT id, job_status, gross_salary, tax_deduction, net_salary, TO_CHAR(date, 'YYYY-MM-DD') as date FROM eSparkTalentAPI_salary WHERE employee_id = $1`
        const params = [employee.rows[0]?.id]

        if (month && year) {
            let monthNumber
            if (isNaN(month)) {
                monthNumber = MONTHS.indexOf(month.toLowerCase()) + 1

                if (monthNumber === 0) {
                    return res.status(400).json({ message: "Invalid month name" })
                }
            } else {
                monthNumber = Number.parseInt(month)
                if (monthNumber < 1 || monthNumber > 12) {
                    return res.status(400).json({ message: "Month must be between 1 and 12" })
                }
            }

            query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`
            params.push(monthNumber, Number.parseInt(year))
        } else if (month) {
            let monthNumber
            if (isNaN(month)) {
                monthNumber = MONTHS.indexOf(month.toLowerCase()) + 1

                if (monthNumber === 0) {
                    return res.status(400).json({ message: "Invalid month name" })
                }
            } else {
                monthNumber = Number.parseInt(month)
                if (monthNumber < 1 || monthNumber > 12) {
                    return res.status(400).json({ message: "Month must be between 1 and 12" })
                }
            }

            query += ` AND EXTRACT(MONTH FROM date) = $2`
            params.push(monthNumber)
        } else if (year) {
            query += ` AND EXTRACT(YEAR FROM date) = $2`
            params.push(Number.parseInt(year))
        }

        const salaries = await pool.query(query, params)

        return res.status(200).json(salaries.rows)  
    } catch (error) {
        logger.error(`Error getting salary: ${error}`)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export default getSalary