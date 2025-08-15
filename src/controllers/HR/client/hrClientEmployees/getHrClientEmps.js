import pool from "../../../../config/db.js";
import { logger } from "../../../../helpers/logger.js";
import { getSignedUrl } from "../../../../helpers/s3.js";

const getHrClientEmps = async (req, res) => {
  const { c_email, tab } = req.query;

  try {
    const clientQuery = `
      SELECT id FROM eSparkTalentAPI_client WHERE email = $1
    `;
    const clientResult = await pool.query(clientQuery, [c_email]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const clientId = clientResult.rows[0].id;

    let query = `
  SELECT o.id, o.employee_id AS emp_pk, e.email, e.first_name, e.last_name, e.image,
         o.job_title, o.status
  FROM eSparkTalentAPI_outsource_employees o
  JOIN eSparkTalentAPI_employee e ON o.employee_id = e.id
  WHERE o.client_id = $1
`;

    const values = [clientId];

    if (tab !== "all") {
      query += ` AND o.status = $2`;
      values.push(tab);
    }

    const { rows } = await pool.query(query, values);

    if (!rows.length) {
      return res.status(200).json([]);
    }

    const formatted = await Promise.all(
      rows.map(async (row) => {
        let imageUrl = null;
        try {
          if (row.image) {
            imageUrl = await getSignedUrl(row.image);
          }
        } catch (err) {
          logger.warn(
            `Signed URL error for image ${row.image}: ${err.message}`
          );
        }

        return {
          id: row.id,
          emp_pk: Number(row.emp_pk),
          email: row.email,
          name: `${row.first_name} ${row.last_name}`,
          image: imageUrl,
          job_title: row.job_title,
          status: row.status,
        };
      })
    );

    return res.status(200).json(formatted);
  } catch (err) {
    logger.error(`GET /hr_clientemps failed: ${err.message}`);
    return res.status(400).json({ message: "Bad Request" });
  }
};

export default getHrClientEmps;
