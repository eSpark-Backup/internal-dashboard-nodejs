import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";
import { getSignedUrl } from "../../../../helpers/s3.js";

const getOutsourceEligibleEmployees = async (req, res) => {
  const { c_email } = req.query;
  const TALENT_EMAIL =
    process.env.TALENT_EMAIL || "talent@esparkconsultants.com";

  let client;

  try {
    
    client = await pool.connect();

    const talentClientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [TALENT_EMAIL]
    );
    const talentId = talentClientResult.rows[0]?.id;

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [c_email]
    );
    const clientId = clientResult.rows[0]?.id;

    if (!talentId || !clientId) {
      return res.status(404).json({ message: "Client(s) not found" });
    }

    const talentOutsourceResult = await client.query(
      `SELECT employee_id, job_title FROM eSparkTalentAPI_outsource_employees WHERE client_id = $1`,
      [talentId]
    );

    const clientOutsourceResult = await client.query(
      `SELECT employee_id FROM eSparkTalentAPI_outsource_employees WHERE client_id = $1`,
      [clientId]
    );

    const talentEmployees = talentOutsourceResult.rows;
    const clientEmployeesSet = new Set(
      clientOutsourceResult.rows.map((r) => r.employee_id)
    );

    const records = [];

    for (const outsrcd_emp of talentEmployees) {
      if (!clientEmployeesSet.has(outsrcd_emp.employee_id)) {
        try {
          const empResult = await client.query(
            `SELECT id, employee_id, first_name, last_name, gender, image 
             FROM eSparkTalentAPI_employee 
             WHERE id = $1`,
            [outsrcd_emp.employee_id]
          );

          if (empResult.rows.length) {
            const emp = empResult.rows[0];

            let signedImage = emp.image || "";
            if (signedImage) {
              try {
                signedImage = await getSignedUrl(signedImage);
              } catch (err) {
                logger.warn(
                  `Failed to sign image for employee_id ${emp.employee_id}: ${err.message}`
                );
              }
            }

            records.push({
              id: Number(emp.id),
              employee_id: emp.employee_id,
              name: `${emp.first_name} ${emp.last_name}`,
              gender: emp.gender,
              image: signedImage,
              job_title: outsrcd_emp.job_title,
              status: "active",
            });
          }
        } catch (err) {
          logger.warn(
            `Error fetching employee details for id=${outsrcd_emp.employee_id}:`,
            err
          );
          continue;
        }
      }
    }

    return res.status(200).json(records);
  } catch (err) {
    logger.error("Error in getOutsourceEligibleEmployees:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getOutsourceEligibleEmployees;