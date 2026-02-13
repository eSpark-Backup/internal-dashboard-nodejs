const payfastConfig = {
  environment: process.env.PAYFAST_ENVIRONMENT || "sandbox",
  merchantId: process.env.PAYFAST_MERCHANT_ID,
  securedKey: process.env.PAYFAST_SECURED_KEY,
  merchantName: process.env.PAYFAST_MERCHANT_NAME || "eSpark Talent",

  sandbox: {
    tokenUrl:
      "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken",
    transactionUrl:
      "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction",
  },

  production: {
    tokenUrl: process.env.PAYFAST_PRODUCTION_TOKEN_URL || "",
    transactionUrl: process.env.PAYFAST_PRODUCTION_TRANSACTION_URL || "",
  },

  successUrl:
    process.env.PAYFAST_SUCCESS_URL ||
    "http://localhost:3000/api/payment/success",
  failureUrl:
    process.env.PAYFAST_FAILURE_URL ||
    "http://localhost:3000/api/payment/failure",
  checkoutUrl:
    process.env.PAYFAST_CHECKOUT_URL ||
    "http://localhost:3000/api/payfast/webhook",

  tokenCacheDuration: 55,
  currency: "PKR",
  procCode: "00",
  version: "eSpark-HRMS-1.0",
  tranType: "ECOMM_PURCHASE",

  validate() {
    const errors = [];
    const warnings = [];

    // Critical validations
    if (!this.merchantId) {
      errors.push("❌ PAYFAST_MERCHANT_ID is required");
    }

    if (!this.securedKey) {
      errors.push("❌ PAYFAST_SECURED_KEY is required");
    }

    if (this.environment === "production") {
      if (!this.production.tokenUrl) {
        errors.push(
          "❌ PAYFAST_PRODUCTION_TOKEN_URL is required for production",
        );
      }
      if (!this.production.transactionUrl) {
        errors.push(
          "❌ PAYFAST_PRODUCTION_TRANSACTION_URL is required for production",
        );
      }

      // Production URL validations
      if (!this.successUrl.startsWith("https://")) {
        warnings.push("⚠️  PAYFAST_SUCCESS_URL should use HTTPS in production");
      }
      if (!this.failureUrl.startsWith("https://")) {
        warnings.push("⚠️  PAYFAST_FAILURE_URL should use HTTPS in production");
      }
      if (!this.checkoutUrl.startsWith("https://")) {
        errors.push(
          "❌ PAYFAST_CHECKOUT_URL MUST use HTTPS in production (webhook requirement)",
        );
      }
    }

    // Webhook URL validation
    if (
      this.checkoutUrl.includes("localhost") ||
      this.checkoutUrl.includes("127.0.0.1")
    ) {
      warnings.push(
        "⚠️  PAYFAST_CHECKOUT_URL is localhost - PayFast cannot reach this. Use ngrok or public URL.",
      );
    }

    if (warnings.length > 0) {
      console.warn(
        "\n⚠️  PayFast Configuration Warnings:\n" + warnings.join("\n"),
      );
    }

    if (errors.length > 0) {
      throw new Error(
        "\n❌ PayFast Configuration Errors:\n" + errors.join("\n"),
      );
    }

    console.log("✅ PayFast configuration validated successfully");
    console.log(`📌 Environment: ${this.environment}`);
    console.log(`📌 Merchant ID: ${this.merchantId}`);
    console.log(`📌 Webhook URL: ${this.checkoutUrl}`);

    return true;
  },

  getUrls() {
    return this.environment === "production" ? this.production : this.sandbox;
  },
};

export default payfastConfig;
