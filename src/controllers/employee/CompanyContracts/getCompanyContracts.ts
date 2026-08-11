import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getCompanyContracts = async (req, res) => {
    const { email } = req.user || {};

    try {
        const employeeContractResult = await pool.query(
            `SELECT 
                cc.id, 
                e.email, 
                e.employee_id,
                cc.contract_name, 
                TO_CHAR(cc.date, 'YYYY-MM-DD') as date
             FROM eSparkTalentAPI_employee_contract cc
             JOIN eSparkTalentAPI_employee e ON cc.employee_id = e.id WHERE e.email = $1`, [email]
        );

        return res.status(200).json(employeeContractResult.rows);
    }
    catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default getCompanyContracts;
