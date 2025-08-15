import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { downloadFileFromS3 } from "../../../helpers/s3.js";


const downloadCompanyContract = async (req, res) => {
    const { id, tab } = req.query;
    
    switch (tab) {
        case "client":
            try {
                const clientContract = await pool.query("SELECT * FROM eSparkTalentAPI_client_contract WHERE id = $1", [id]);
        
                if (!clientContract.rows[0]) {
                    return res.status(404).json({ message: "Client contract with this id does not exist" });
                }
        
                const contractDoc = clientContract.rows[0].contract_doc;
        
                if (!contractDoc) {
                    return res.status(404).json({ message: "Client contract document not found" });
                }
        
                return downloadFileFromS3(res, contractDoc, `client_contract.pdf`, "application/pdf");
        
            } catch (error) {
                logger.error(`Error getting client contract document: ${error}`);
                return res.status(500).json({ message: "Internal Server Error" });
            } 
        case "employee":
            try {
                const employeeContract = await pool.query("SELECT * FROM eSparkTalentAPI_employee_contract WHERE id = $1", [id]);
        
                if (!employeeContract.rows[0]) {
                    return res.status(404).json({ message: "Employee contract with this id does not exist" });
                }
        
                const contractDoc = employeeContract.rows[0].contract_doc;
        
                if (!contractDoc) {
                    return res.status(404).json({ message: "Employee contract document not found" });
                }
        
                return downloadFileFromS3(res, contractDoc, `employee_contract.pdf`, "application/pdf");
        
            } catch (error) {
                logger.error(`Error getting employee contract document: ${error}`);
                return res.status(500).json({ message: "Internal Server Error" });
            } 
        default:
            return res.status(400).json({ message: "Invalid tab" });
    }

}

export default downloadCompanyContract;
