import jwt from "jsonwebtoken";
import { CookieOptions } from "express";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const ACCESS_TOKEN_TTL_SEC = 15 * 60;
const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;

export interface TokenPayload {
  id: number;
  username: string;
}

function accessSecret() {
  return process.env.JWT_SECRET as string;
}

function refreshSecret() {
  return (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) as string;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign({ ...payload, type: "access" }, accessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SEC,
  });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign({ ...payload, type: "refresh" }, refreshSecret(), {
    expiresIn: REFRESH_TOKEN_TTL_SEC,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, accessSecret()) as TokenPayload & { type: string };
  if (decoded.type !== "access") throw new Error("Not an access token");
  return decoded;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, refreshSecret()) as TokenPayload & { type: string };
  if (decoded.type !== "refresh") throw new Error("Not a refresh token");
  return decoded;
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function accessCookieOptions(): CookieOptions {
  return { ...baseCookieOptions(), maxAge: ACCESS_TOKEN_TTL_SEC * 1000 };
}

export function refreshCookieOptions(): CookieOptions {
  return { ...baseCookieOptions(), maxAge: REFRESH_TOKEN_TTL_SEC * 1000 };
}
