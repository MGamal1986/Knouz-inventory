import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

export async function login(username: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !admin.isActive) {
    throw Object.assign(new Error("Invalid username or password"), { status: 401 });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid username or password"), { status: 401 });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET as string,
    { expiresIn: "12h" }
  );

  return { token, admin: { id: admin.id, username: admin.username, fullName: admin.fullName } };
}

export async function changePassword(adminId: number, currentPassword: string, newPassword: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw Object.assign(new Error("Admin not found"), { status: 404 });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) throw Object.assign(new Error("Current password is incorrect"), { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: adminId }, data: { passwordHash } });
}

export async function createAdmin(username: string, password: string, fullName?: string) {
  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) throw Object.assign(new Error("Username already taken"), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.admin.create({
    data: { username, passwordHash, fullName },
    select: { id: true, username: true, fullName: true, createdAt: true },
  });
}

export async function listAdmins() {
  return prisma.admin.findMany({
    select: { id: true, username: true, fullName: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
