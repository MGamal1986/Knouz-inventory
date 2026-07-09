import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../../middleware/auth";
import * as authService from "./auth.service";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const result = await authService.login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});

router.post("/change-password", requireAuth, async (req: AuthedRequest, res, next) => {
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

router.post("/admins", requireAuth, async (req, res, next) => {
  try {
    const data = createAdminSchema.parse(req.body);
    const admin = await authService.createAdmin(data.username, data.password, data.fullName);
    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
});

router.get("/admins", requireAuth, async (_req, res, next) => {
  try {
    const admins = await authService.listAdmins();
    res.json(admins);
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});

export default router;
