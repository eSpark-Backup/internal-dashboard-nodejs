import pool from "../../../config/db.js";

const TALENT_EMAIL = process.env.TALENT_EMAIL;

export const hrHome = async (req, res) => {
  const { email, role, username } = req.user;
  const client = await pool.connect();

  try {
    const companyRes = await client.query(
      "SELECT image FROM eSparkTalentAPI_company_data LIMIT 1"
    );
    const company_image = companyRes.rows[0]?.image || "";

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
    console.error("Error in hr_home:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
