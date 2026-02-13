import crypto from "crypto";
import payfastConfig from "../../config/payfast.config.js";
import db from "../../config/db.js";
import { logger } from "../../helpers/logger.js";

class PayFastService {
  /**
   * Get valid access token (cached or fresh)
   */
  async getAccessToken(basketId, amount) {
    try {
      // Check for valid cached token
      // const cachedToken = await this.getCachedToken();
      // if (cachedToken) {
      //   return cachedToken;
      // }

      // Request new token from PayFast
      return await this.requestNewToken(basketId, amount);
    } catch (error) {
      logger.error("PayFast getAccessToken error:", error);
      throw error;
    }
  }

  /**
   * Get cached token from database if valid
   */
  async getCachedToken() {
    const query = `
      SELECT access_token, expires_at 
      FROM eSparkTalentAPI_payfast_tokens 
      WHERE merchant_id = $1 
        AND expires_at > NOW() 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await db.query(query, [payfastConfig.merchantId]);

    if (result.rows.length > 0) {
      const token = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(token.expires_at);

      // Return token if still valid for at least 5 more minutes
      if (expiresAt - now > 5 * 60 * 1000) {
        logger.info("Using cached PayFast token");
        return token.access_token;
      }
    }

    return null;
  }

  /**
   * Request new access token from PayFast API
   */
  async requestNewToken(basketId, amount) {
    const urls = payfastConfig.getUrls();

    const payload = new URLSearchParams({
      MERCHANT_ID: payfastConfig.merchantId,
      SECURED_KEY: payfastConfig.securedKey,
      TXNAMT: amount.toString(),
      BASKET_ID: basketId,
      CURRENCY_CODE: payfastConfig.currency,
    });

    logger.info("PayFast token request payload:", payload.toString());

    const requestData = {
      endpoint: urls.tokenUrl,
      method: "POST",
      request_payload: Object.fromEntries(payload),
    };

    try {
      const response = await fetch(urls.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "eSpark-HRMS/1.0",
        },
        body: payload.toString(),
      });

      const data = await response.json();

      // Log API call
      await this.logApiCall({
        ...requestData,
        response_payload: data,
        status_code: response.status,
        basket_id: basketId,
      });

      if (!response.ok || !data.ACCESS_TOKEN) {
        throw new Error(
          data.message || "Failed to get access token from PayFast",
        );
      }

      // Cache token in database
      await this.cacheToken(data.ACCESS_TOKEN, data.REFRESH_TOKEN);

      logger.info("New PayFast access token generated successfully");
      return data.ACCESS_TOKEN;
    } catch (error) {
      // Log error
      await this.logApiCall({
        ...requestData,
        status_code: 500,
        error: error.message,
        basket_id: basketId,
      });

      throw error;
    }
  }

  /**
   * Cache token in database
   */
  async cacheToken(accessToken, refreshToken = null) {
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + payfastConfig.tokenCacheDuration,
    );

    const query = `
      INSERT INTO eSparkTalentAPI_payfast_tokens 
        (access_token, refresh_token, merchant_id, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    await db.query(query, [
      accessToken,
      refreshToken,
      payfastConfig.merchantId,
      expiresAt,
    ]);
  }

  /**
   * Validate payment response hash from PayFast
   */
  validateHash(basketId, errorCode, receivedHash) {
    const hashString = `${basketId}|${payfastConfig.securedKey}|${payfastConfig.merchantId}|${errorCode}`;
    const calculatedHash = crypto
      .createHash("sha256")
      .update(hashString)
      .digest("hex");

    const isDev = !(
      process.env.NODE_ENV === "production" || process.env.ENV === "prod"
    );
    if (isDev) {
      console.log("PayFast hash validation debug:");
      console.log("basketId:", basketId);
      console.log("securedKey:", payfastConfig.securedKey);
      console.log("merchantId:", payfastConfig.merchantId);
      console.log("err_code:", errorCode);
      console.log("string to hash:", hashString);
      console.log("calculated hash:", calculatedHash);
      console.log("received hash:", receivedHash);
    }

    return calculatedHash === receivedHash;
  }

  /**
   * Get transaction status from PayFast
   */
  async getTransactionStatus(basketId) {
    const urls = payfastConfig.getUrls();
    const token = await this.getAccessToken(basketId, 0);

    const requestData = {
      endpoint: `${urls.transactionUrl}?basket_id=${basketId}`,
      method: "GET",
    };

    try {
      const response = await fetch(
        `${urls.transactionUrl}?basket_id=${basketId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "eSpark-HRMS/1.0",
          },
        },
      );

      const data = await response.json();

      // Log API call
      await this.logApiCall({
        ...requestData,
        response_payload: data,
        status_code: response.status,
        basket_id: basketId,
      });

      return data;
    } catch (error) {
      // Log error
      await this.logApiCall({
        ...requestData,
        status_code: 500,
        error: error.message,
        basket_id: basketId,
      });

      throw error;
    }
  }

  /**
   * Log API calls to database for audit trail
   */
  async logApiCall({
    endpoint,
    method,
    request_payload = null,
    response_payload = null,
    status_code = null,
    basket_id = null,
    error = null,
    ip_address = null,
    user_agent = null,
  }) {
    try {
      const query = `
        INSERT INTO eSparkTalentAPI_payfast_logs 
          (endpoint, method, request_payload, response_payload, status_code, basket_id, error, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await db.query(query, [
        endpoint,
        method,
        request_payload ? JSON.stringify(request_payload) : null,
        response_payload ? JSON.stringify(response_payload) : null,
        status_code,
        basket_id,
        error,
        ip_address,
        user_agent,
      ]);
    } catch (logError) {
      logger.error("Failed to log PayFast API call:", logError);
    }
  }

  /**
   * Generate unique basket ID for invoice
   */
  generateBasketId(invoiceId, invoiceType) {
    const prefix = invoiceType === "SALARY" ? "SAL" : "CUS";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${invoiceId}-${timestamp}`;
  }

  /**
   * Generate unique basket ID for bulk payment
   */
  generateBulkBasketId(clientId) {
    const timestamp = Date.now().toString().slice(-6);
    return `BULK-${clientId}-${timestamp}`;
  }

  /**
   * Check if error code indicates success
   */
  isSuccessCode(errorCode) {
    return errorCode === "000" || errorCode === "00";
  }

  /**
   * Get human-readable error message
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      "000": "Transaction Successful",
      "00": "Transaction Successful",
      "002": "Transaction Timeout",
      97: "Insufficient Balance",
      106: "Transaction Limit Exceeded",
      "03": "Inactive Account",
      104: "Incorrect Details",
      55: "Invalid OTP/PIN",
      54: "Card Expired",
      13: "Invalid Amount",
      126: "Invalid Account Details",
      75: "Maximum PIN Retries Exceeded",
      14: "Inactive Card",
      15: "Inactive Card",
      42: "Invalid CNIC",
      423: "Unable to process request, please try again later",
      41: "Details Mismatched",
      600: "OTP Expired",
      309: "Invalid OTP Length",
      853: "Invalid Account Details",
      "04": "Closed Account",
      537: "Dormant Account",
      359: "Blocked Account",
      880: "Local ecommerce not activated",
      881: "Insufficient funds",
      882: "Daily transaction limit reached",
      883: "Ecommerce service not activated",
      9000: "Transaction rejected by fraud system",
      9010: "Fraud system error",
    };

    return errorMessages[errorCode] || "Unknown error occurred";
  }
}

export default new PayFastService();
