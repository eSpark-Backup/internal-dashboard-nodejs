// src/middleware/auth.js
import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
  
  if (error) {
    return res.status(401).json({
      detail: "Given token not valid for any token type",
      code: "token_not_valid",
      messages: [
        {
          token_class: "AccessToken",
          token_type: "access",
          message: "Token is invalid or expired",
        },
      ],
    });
  }

  req.user = user;
    next();
  });
};
