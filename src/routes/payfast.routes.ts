import express from "express";
import { handlePaymentSuccess } from "../controllers/payfast/paymentSuccess.js";
import { handlePaymentFailure } from "../controllers/payfast/paymentFailure.js";

const router = express.Router();

// PayFast success redirect URL
router.all("/success", handlePaymentSuccess);

// PayFast failure redirect URL
router.all("/failure", handlePaymentFailure);

export default router;
