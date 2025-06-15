import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getCompanyContracts = async (req, res) => {
    const { status } = req.query;

    switch (status) {
        case "clients":
            try {
                const clientContractResult = await pool.query(
                    `SELECT 
                        cc.id, 
                        cc.contract_name, 
                        c.email, 
                        c.client_id,
                        TO_CHAR(cc.date, 'YYYY-MM-DD') as date
                     FROM eSparkTalentAPI_client_contract cc
                     JOIN eSparkTalentAPI_client c ON cc.client_id = c.id`
                );
            
                return res.status(200).json(clientContractResult.rows);
            } catch (error) {
                logger.error(error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        case "employees":
            try {
                const employeeContractResult = await pool.query(
                    `SELECT 
                        cc.id, 
                        cc.contract_name, 
                        e.email, 
                        e.employee_id,
                        TO_CHAR(cc.date, 'YYYY-MM-DD') as date
                     FROM eSparkTalentAPI_employee_contract cc
                     JOIN eSparkTalentAPI_employee e ON cc.employee_id = e.id`
                );

                return res.status(200).json(employeeContractResult.rows);
            }
            catch (error) {
                logger.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }
        default:
            return res.status(400).json({ message: "Invalid status" });
    }


}

export default getCompanyContracts;
