import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import dotenv from "dotenv";
import { getSignedUrl } from "../../../helpers/s3.js";

dotenv.config();

const s3Endpoint = process.env.S3_ENDPOINT;
const s3Bucket = process.env.S3_BUCKET;

const TALENT_EMAIL = process.env.TALENT_EMAIL;

const hrHome = async (req, res) => {
  const { email, role, username } = req.user;

  let client;

  try {
    client = await pool.connect();

    const companyRes = await client.query(
      "SELECT image FROM eSparkTalentAPI_company_data LIMIT 1"
    );

    // const company_image = companyRes.rows[0]?.image || "";
    const rawCompanyImage = companyRes.rows[0]?.image || "";
    const company_image =
      rawCompanyImage && (await getSignedUrl(rawCompanyImage));

    const [employeesRes, clientsRes, hiringRes, interviewRes] =
      await Promise.all([
        client.query("SELECT COUNT(*) FROM eSparkTalentAPI_employee"),
        client.query(
          "SELECT COUNT(*) FROM eSparkTalentAPI_client WHERE email != $1",
          [TALENT_EMAIL]
        ),
        client.query("SELECT COUNT(*) FROM eSparkTalentAPI_hiring_request"),
        client.query("SELECT COUNT(*) FROM eSparkTalentAPI_interview_schedule"),
      ]);

    const commonCounts = {
      employees: parseInt(employeesRes.rows[0].count, 10),
      clients: parseInt(clientsRes.rows[0].count, 10),
      hiring_requests: parseInt(hiringRes.rows[0].count, 10),
      interview_schedules: parseInt(interviewRes.rows[0].count, 10),
    };

    if (role === "super_admin") {
      return res.status(200).json({
        user: username,
        company_image,
        ...commonCounts,
      });
    }

    const permRes = await client.query(
      `SELECT image, employee_perms, client_perms, leaves_perms,
              invoices_perms, policies_perms, guides_perms
       FROM eSparkTalentAPI_account_n_persmission
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const row = permRes.rows[0] || {};
    return res.status(200).json({
      user: username,
      company_image,
      user_image: row.image || "",
      employee_perms: row.employee_perms || {},
      client_perms: row.client_perms || {},
      leaves_perms: row.leaves_perms || {},
      invoices_perms: row.invoices_perms || {},
      policies_perms: row.policies_perms || {},
      guides_perms: row.guides_perms || {},
      ...commonCounts,
    });
  } catch (err) {
    logger.error("Error in hr_home:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default hrHome;
