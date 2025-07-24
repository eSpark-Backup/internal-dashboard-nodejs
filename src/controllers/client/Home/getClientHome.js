import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";

const getClientHome = async (req, res) => {
  const { email, username } = req.user;
  
  let client;

  if (!email) {
    logger.warn("Client Home API: Missing email in JWT payload.");
    return res.status(401).json({ message: "Unauthorized: Missing email" });
  }

  logger.info(`Client Home API triggered for: ${email}`);

  try {
    client = await pool.connect();

    const [
      hiringCountRes,
      interviewCountRes,
      onboardingCountRes,
      activeEmpRes,
      clientDataRes,
      companyDataRes,
    ] = await Promise.all([
      client.query(
        `SELECT COUNT(*) FROM eSparkTalentAPI_hiring_request WHERE client_id = (
        SELECT id FROM eSparkTalentAPI_client WHERE email = $1
      )`,
        [email]
      ),
      client.query(
        `SELECT COUNT(*) FROM eSparkTalentAPI_interview_schedule WHERE client_id = (
        SELECT id FROM eSparkTalentAPI_client WHERE email = $1
      )`,
        [email]
      ),
      client.query(
        `SELECT COUNT(*) FROM eSparkTalentAPI_onboarding WHERE client_id = (
        SELECT id FROM eSparkTalentAPI_client WHERE email = $1
      )`,
        [email]
      ),
      client.query(
        `SELECT COUNT(*) FROM eSparkTalentAPI_outsource_employees WHERE client_id = (
        SELECT id FROM eSparkTalentAPI_client WHERE email = $1
      ) AND status = 'active'`,
        [email]
      ),
      client.query(
        `SELECT image FROM eSparkTalentAPI_client WHERE email = $1`,
        [email]
      ),
      client.query(`SELECT image FROM eSparkTalentAPI_company_data LIMIT 1`),
    ]);

    const hiring_request_count = parseInt(
      hiringCountRes.rows[0]?.count || 0,
      10
    );
    const interview_schedule_count = parseInt(
      interviewCountRes.rows[0]?.count || 0,
      10
    );
    const onboarding_count = parseInt(
      onboardingCountRes.rows[0]?.count || 0,
      10
    );
    const active_employee = parseInt(activeEmpRes.rows[0]?.count || 0, 10);
    logger.info(
      `Client: ${email}, HR: ${hiring_request_count}, Interview: ${interview_schedule_count}, Onboarding: ${onboarding_count}, Active: ${active_employee}`
    );

    let client_image = clientDataRes.rows[0]?.image || null;
    if (client_image) {
      try {
        client_image = await getSignedUrl(client_image);
      } catch (err) {
        logger.warn(`Failed to sign client image for ${email}: ${err.message}`);
      }
    }

    let company_image = companyDataRes.rows[0]?.image || "";
    if (company_image) {
      try {
        company_image = await getSignedUrl(company_image);
      } catch (err) {
        logger.warn(`Failed to sign company image: ${err.message}`);
      }
    }

    return res.status(200).json({
       username: username || "",
      hiring_request_count,
      interview_schedule_count,
      onboarding_count,
      active_employee,
      client_image,
      company_image,
    });
  } catch (err) {
    logger.error(`Error in getClientHome for ${email}: ${err.message}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default getClientHome;
