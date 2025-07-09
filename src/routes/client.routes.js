import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import getClientHome from "../controllers/client/Home/getClientHome.js";
import getHiringRequests from "../controllers/client/HiringRequests/getHiringRequests.js";
import deleteHiringRequest from "../controllers/client/HiringRequests/deleteHiringRequest.js";


const router = express.Router();

router.get("/c_home", authenticateJWT, getClientHome);

// Hiring Requests 

router.get("/c_hr",
  authenticateJWT,
  getHiringRequests
);

router.delete("/c_hr",
  authenticateJWT,
  deleteHiringRequest
);

export default router;
