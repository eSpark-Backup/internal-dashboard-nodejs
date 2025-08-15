import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import bcrypt from "bcrypt";

const updateClientPassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const { email } = req.user;

  let client;

  try {
    
    client = await pool.connect();

    const result = await client.query(
      `SELECT password FROM eSparkTalentAPI_end_user WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isPasswordCorrect = await bcrypt.compare(
      current_password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: "Incorrect current password" });
    }

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ message: "New password and confirmation do not match" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await client.query(
      `UPDATE eSparkTalentAPI_end_user SET password = $1 WHERE email = $2`,
      [hashedPassword, email]
    );

    return res
      .status(200)
      .json({ message: "Password is successfully updated" });
  } catch (error) {
    logger.error("Error updating client password:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default updateClientPassword;
