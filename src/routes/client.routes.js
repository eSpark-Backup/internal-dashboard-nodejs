import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import getClientHome from "../controllers/client/Home/getClientHome.js";


const router = express.Router();

router.get("/client", authenticateJWT, (req, res) => {
  res.json({ message: "Client route" });
});

router.get("/c_home", authenticateJWT, getClientHome);

export default router;
