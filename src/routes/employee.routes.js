import express from "express";
import { authenticateJWT } from "../middleware/auth.js";


const router = express.Router();

router.get("/emp", authenticateJWT, (req, res) => {
  res.json({ message: "Employee route" });
});

export default router;
