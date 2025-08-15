import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updatePolicyAssignment = async (req, res) => {
    const { data } = req.body

    try {
        const policyIds = data.map((item) => item.id)
        const validPolicyIds = await pool.query("SELECT id FROM eSparkTalentAPI_policy WHERE id = ANY($1)", [policyIds])

        if (validPolicyIds.rowCount !== policyIds.length) {
            return res.status(400).json({ message: "Invalid policy IDs" })
        }

        const employeeCases = data.map((item, index) => `WHEN id = $${index * 3 + 1} THEN $${index * 3 + 2}::boolean`).join(" ")
        const clientCases = data.map((item, index) => `WHEN id = $${index * 3 + 1} THEN $${index * 3 + 3}::boolean`).join(" ")

        const params = data.flatMap((item) => [
            item.id,
            item.employee,
            item.client
        ]);

        const query = `
              UPDATE eSparkTalentAPI_policy 
              SET 
                  employee = CASE ${employeeCases} END,
                  client = CASE ${clientCases} END
              WHERE id = ANY($${params.length + 1})
          `

        await pool.query(query, [...params, policyIds])

        return res.status(200).json({ message: "Policy assignment updated successfully" })
    } catch (error) {
        logger.error(`Error updating policy assignment: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default updatePolicyAssignment;


