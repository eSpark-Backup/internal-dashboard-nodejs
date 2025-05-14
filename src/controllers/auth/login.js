import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../../config/db.js";
import { logger } from "../../helpers/logger.js";
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM eSparkTalentAPI_end_user WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    // Final response as requested
    return res.json({ role: user.role, token });
  } catch (err) {
    logger.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default login;
