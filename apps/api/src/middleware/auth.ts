import { Request, Response, NextFunction } from "express";
import { ACCESS_COOKIE, verifyAccessToken } from "../lib/tokens";

export interface AuthedRequest extends Request {
  admin?: { id: number; username: string };
}

// Exact-match allowlist of routes reachable without a valid access token.
// Checked inside the middleware itself (not by mount order) so it can't be
// bypassed by accidentally registering a new route in the wrong place.
const PUBLIC_PATHS = new Set([
  "/health",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
