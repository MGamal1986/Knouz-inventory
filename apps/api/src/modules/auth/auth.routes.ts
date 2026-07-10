import { Router } from "express";
import { z } from "zod";
import { AuthedRequest } from "../../middleware/auth";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "../../lib/tokens";
import * as authService from "./auth.service";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, admin } = await authService.login(username, password);
    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ admin });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const { accessToken, refreshToken, admin } = await authService.refresh(token);
    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ admin });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(ACCESS_COOKIE, { ...accessCookieOptions(), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});

router.post("/change-password", async (req: AuthedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.admin!.id, currentPassword, newPassword);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

const createAdminSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(4),
  fullName: z.string().optional(),
});

router.post("/admins", async (req, res, next) => {
  try {
    const data = createAdminSchema.parse(req.body);
    const admin = await authService.createAdmin(data.username, data.password, data.fullName);
    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
});

router.get("/admins", async (_req, res, next) => {
  try {
    const admins = await authService.listAdmins();
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});

export default router;
