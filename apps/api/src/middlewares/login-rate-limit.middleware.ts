import { rateLimit } from "express-rate-limit";

export const createLoginRateLimit = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => {
      res.status(429).json({
        message: "Too many login attempts. Please try again later.",
      });
    },
  });

export const loginRateLimit = createLoginRateLimit();
