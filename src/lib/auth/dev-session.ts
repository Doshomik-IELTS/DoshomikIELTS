import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { DEV_AUTH, DEV_ADMIN_AUTH } from "@/config/dev-auth";

const COOKIE_NAME = "doshomikielts-dev-session";

export type DevSessionUser = {
  email: string;
  name: string;
  role?: "learner" | "admin";
};

function secret() {
  return process.env.DEV_AUTH_SECRET ?? "doshomikielts-dev-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createDevSessionToken(user: DevSessionUser) {
  const payload = encode(JSON.stringify(user));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyDevSessionToken(token?: string | null): DevSessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuf, signatureBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decode(payload)) as DevSessionUser;
    if (!parsed?.email || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readDevSession() {
  const store = await cookies();
  return verifyDevSessionToken(store.get(COOKIE_NAME)?.value);
}

export function devCredentialsMatch(email: string, password: string) {
  return getDevCredentialRole(email, password) !== null;
}

export function getDevCredentialRole(email: string, password: string): "learner" | "admin" | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === DEV_ADMIN_AUTH.email && password === DEV_ADMIN_AUTH.password) {
    return "admin";
  }

  if (normalizedEmail === DEV_AUTH.email && password === DEV_AUTH.password) {
    return "learner";
  }

  return null;
}

export function getDevAuthCookieName() {
  return COOKIE_NAME;
}

export function getDevAuthSeedProfile(role: "learner" | "admin" = "learner") {
  const cfg = role === "admin" ? DEV_ADMIN_AUTH : DEV_AUTH;
  return {
    authUserId: `dev:${role}`,
    email: cfg.email,
    name: cfg.name,
    targetBand: cfg.targetBand,
    examDate: new Date(cfg.examDate),
    nativeLanguage: cfg.nativeLanguage,
    studyGoal: cfg.studyGoal,
  };
}
