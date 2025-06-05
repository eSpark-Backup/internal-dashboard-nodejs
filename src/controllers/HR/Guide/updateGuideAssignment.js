import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateGuideAssignment = async (req, res) => {
    const { data } = req.body

    try {
        const guideIds = data.map((item) => item.id)
        const validGuideIds = await pool.query("SELECT id FROM eSparkTalentAPI_guide WHERE id = ANY($1)", [guideIds])

        if (validGuideIds.rowCount !== guideIds.length) {
            return res.status(400).json({ message: "Invalid guide IDs" })
        }

        const employeeCases = data.map((item, index) => `WHEN id = $${index * 3 + 1} THEN $${index * 3 + 2}::boolean`).join(" ")
        const clientCases = data.map((item, index) => `WHEN id = $${index * 3 + 1} THEN $${index * 3 + 3}::boolean`).join(" ")

        const params = data.flatMap((item) => [
            item.id,
            item.employee,
            item.client
        ]);

        const query = `
              UPDATE eSparkTalentAPI_guide 
              SET 
                  employee = CASE ${employeeCases} END,
                  client = CASE ${clientCases} END
              WHERE id = ANY($${params.length + 1})
          `

        await pool.query(query, [...params, guideIds])

        return res.status(200).json({ message: "Guide assignment updated successfully" })
    } catch (error) {
        logger.error(`Error updating guide assignment: ${error}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default updateGuideAssignment;


