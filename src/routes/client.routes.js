import express from "express";
import { authenticateJWT } from "../middleware/auth.js";


const router = express.Router();

router.get("/client", authenticateJWT, (req, res) => {
  res.json({ message: "Client route" });
});

export default router;
