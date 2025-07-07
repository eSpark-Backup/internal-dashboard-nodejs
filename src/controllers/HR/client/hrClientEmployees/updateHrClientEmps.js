import { logger } from "../../../../helpers/logger.js";
import pool from "../../../../config/db.js";

const updateHrClientEmps = async (req, res) => {
  const { id } = req.query;
  const { status } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: outsourceRows } = await client.query(
      `SELECT * FROM eSparkTalentAPI_outsource_employees WHERE id = $1`,
      [id]
    );
    const outsource = outsourceRows[0];
    if (!outsource) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Outsource employee not found" });
    }

    const { rows: employeeRows } = await client.query(
      `SELECT first_name, last_name FROM eSparkTalentAPI_employee WHERE id = $1`,
      [outsource.employee_id]
    );

    const employee = employeeRows[0];
    if (!employee) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Employee record not found" });
    }

    const fullName = `${employee.first_name} ${employee.last_name}`;

    const { rows: clientRows } = await client.query(
      `SELECT email FROM eSparkTalentAPI_client WHERE id = $1`,
      [outsource.client_id]
    );
    const clientInfo = clientRows[0];
    if (!clientInfo) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const clientEmail = clientInfo.email;

    const { rows: notifRows } = await client.query(
      `SELECT id FROM eSparkTalentAPI_notifications 
   WHERE email = $1 AND ref_id = $2 AND notification_type = 'team_member'`,
      [clientEmail, outsource.id]
    );

    if (notifRows.length > 0) {
      const notifId = notifRows[0].id;
      const notifStatus = status === "terminated" ? "removed" : "added";
      const notifDescription =
        status === "terminated"
          ? `${fullName} is removed from your team`
          : `${fullName} is added to your team`;

      await client.query(
        `UPDATE eSparkTalentAPI_notifications
         SET status = $1, description = $2
         WHERE id = $3`,
        [notifStatus, notifDescription, notifId]
      );
    }

    await client.query(
      `UPDATE eSparkTalentAPI_outsource_employees SET status = $1 WHERE id = $2`,
      [status, id]
    );

    logger.info(`Status of outsource employee ${fullName} set to ${status}`);
    await client.query("COMMIT");
    return res.status(200).json({
      message: `${fullName} is set to ${status}`,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    logger.error(`Error updating outsource employee status: ${err.message}`);
    return res.status(400).json({ message: "Failed to update status" });
  } finally {
    if (client) client.release();
  }
};

export default updateHrClientEmps;
