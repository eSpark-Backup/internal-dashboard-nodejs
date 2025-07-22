import bcrypt from "bcrypt";
import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const changePassword = async (req, res) => {
  const { email } = req.user;
  const { current_password, new_password } = req.body;

  let client;

  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, password FROM eSparkTalentAPI_end_user WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await client.query(
      `UPDATE eSparkTalentAPI_end_user SET password = $1 WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return res
      .status(200)
      .json({ message: "Credentials have been updated successfully" });
  } catch (err) {
    logger.error("Error in change Password:", err);
    return res.status(400).json({ message: "Something went wrong" });
  } finally {
    if (client) client.release();
  }
};

export default changePassword;
