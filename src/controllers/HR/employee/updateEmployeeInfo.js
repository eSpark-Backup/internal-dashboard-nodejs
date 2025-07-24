import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateEmployeeInfo = async (req, res) => {
  const { id } = req.query;
  const updates = req.body;

  let client;

  try {

    client = await pool.connect();

    await client.query("BEGIN");

    const empResult = await client.query(
      "SELECT * FROM eSparkTalentAPI_employee WHERE id = $1",
      [id]
    );
    if (empResult.rows.length === 0) {
      await client.query("ROLLBACK");
      logger.warn(`Employee not found for ID: ${id}`);

      return res.status(404).json({ message: "Employee not found" });
    }
    const editableFields = [
      "first_name",
      "last_name",
      "dob",
      "gender",
      "personal_email",
      "marital_status",
      "phone_number",
      "joining_date",
      "employee_id",
      "job_title",
      "role",
      "job_status",
      "starting_date",
      "ending_date",
    ];

    const fieldsToUpdate = editableFields.filter((key) => key in updates);

    if (fieldsToUpdate.length > 0) {
      const setClauses = fieldsToUpdate.map((key, i) => `${key} = $${i + 1}`);
      const values = fieldsToUpdate.map((key) => updates[key]);
      values.push(id);

      await client.query(
        `UPDATE eSparkTalentAPI_employee SET ${setClauses.join(
          ", "
        )} WHERE id = $${fieldsToUpdate.length + 1}`,
        values
      );
      logger.info(
        `Updated fields for employee ID ${id}: ${fieldsToUpdate.join(", ")}`
      );
    }

    if ("emergency_contact" in updates) {
      await client.query(
        `UPDATE eSparkTalentAPI_employee
   SET emergency_contact = $1
   WHERE id = $2`,
        [updates.emergency_contact, id]
      );
      logger.info(`Updated emergency_contact for employee ID: ${id}`);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Personal information updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      `Transaction failed and rolled back for employee ID: ${id} - ${error}`
    );

    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default updateEmployeeInfo;
