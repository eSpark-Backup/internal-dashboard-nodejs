import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";

const getLeaveRequests = async (req, res) => {
    const { email } = req.user;
    const { status: getStatus } = req.query;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "Client not found" });
        }

        const clientId = clientResult.rows[0].id;

        let baseQuery = `
            SELECT 
                lr.id,
                e.employee_id,
                e.first_name,
                e.last_name,
                e.image AS employee_image,
                e.punch_timings,
                oe.country,
                oe.job_title AS department,
                lr.leave_type,
                TO_CHAR(lr.start_date, 'DD-MM-YYYY') AS start_date,
                TO_CHAR(lr.end_date, 'DD-MM-YYYY') AS end_date,
                lr.count,
                lr.reason,
                TO_CHAR(lr.created_at, 'DD-MM-YYYY HH12:MI:SS AM') AS requested_at,
                lr.status
            FROM eSparkTalentAPI_leave_request lr
            JOIN eSparkTalentAPI_employee e ON lr.employee_id = e.id
            LEFT JOIN eSparkTalentAPI_outsource_employees oe 
                ON oe.employee_id = lr.employee_id AND oe.client_id = lr.client_id
            WHERE lr.client_id = $1
        `;

        const queryParams = [clientId];

        if (["pending", "completed", "rejected"].includes(getStatus)) {
            baseQuery += ` AND lr.status = $2`;
            queryParams.push(getStatus);
        }

        const result = await pool.query(baseQuery, queryParams);


        const records = await Promise.all(
            result.rows.map(async (row) => {
              let checkIn = "", checkOut = "";
          
              try {
                const punchTimings = row.punch_timings || {};
                checkIn = punchTimings.check_in || "";
                checkOut = punchTimings.check_out || "";
              } catch (err) {
                checkIn = checkOut = "";
              }
          
              let employeeImage = "";
              try {
                employeeImage = await getSignedUrl(row.employee_image);
              } catch (err) {
                logger.warn(`Failed to download image for employee ID ${row.employee_id}: ${err.message}`);
                employeeImage = null;
              }
          
              return {
                id: row.id,
                employee_id: row.employee_id,
                employee_name: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
                country: row.country || "",
                department: row.department || "",
                leave_type: row.leave_type,
                start_date: row.start_date,
                end_date: row.end_date,
                check_in: checkIn,
                check_out: checkOut,
                count: row.count,
                reason: row.reason,
                requested_at: row.requested_at,
                status: row.status,
                employee_image: employeeImage,
              };
            })
          );

        return res.status(200).json(records);
    } catch (error) {
        logger.error(`Error fetching leave requests: ${error.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getLeaveRequests;
