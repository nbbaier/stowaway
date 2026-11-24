import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { PRIVATE_NAMESPACE_ID } from "@/lib/namespace";

const COOKIE_NAME = "stowaway_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export const isPassphraseAuthConfigured = (): boolean =>
  process.env.STOWAWAY_PASSPHRASE !== undefined &&
  process.env.STOWAWAY_PASSPHRASE !== "" &&
  process.env.STOWAWAY_SESSION_SECRET !== undefined &&
  process.env.STOWAWAY_SESSION_SECRET !== "" &&
  process.env.STOWAWAY_SESSION_SECRET.length >= 32;

interface SessionPayload {
  namespaceId: string;
  expiresAt: number;
}

const isSessionPayload = (value: unknown): value is SessionPayload =>
  typeof value === "object" &&
  value !== null &&
  "namespaceId" in value &&
  typeof value.namespaceId === "string" &&
  "expiresAt" in value &&
  typeof value.expiresAt === "number" &&
  Number.isSafeInteger(value.expiresAt);

const getSessionSecret = (): string => {
  const secret = process.env.STOWAWAY_SESSION_SECRET;
  if (secret === undefined || secret.length < 32) {
    throw new Error("STOWAWAY_SESSION_SECRET must be at least 32 characters");
  }
  return secret;
};

const sign = (value: string): string =>
  createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

const isValidPassphrase = (candidate: string): boolean => {
  const expectedPassphrase = process.env.STOWAWAY_PASSPHRASE;
  if (expectedPassphrase === undefined || expectedPassphrase.length === 0) {
    throw new Error("STOWAWAY_PASSPHRASE is not configured");
  }

  const candidateDigest = createHmac("sha256", getSessionSecret())
    .update(candidate)
    .digest();
  const expectedDigest = createHmac("sha256", getSessionSecret())
    .update(expectedPassphrase)
    .digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
};

export const createPassphraseSession = async (
  candidate: string
): Promise<boolean> => {
  if (!isValidPassphrase(candidate)) {
    return false;
  }

  const payload: SessionPayload = {
    namespaceId: PRIVATE_NAMESPACE_ID,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${encodedPayload}.${sign(encodedPayload)}`, {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
};

export const getPassphraseSession = async () => {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value === undefined) {
    return null;
  }

  const [encodedPayload, providedSignature, extra] = value.split(".");
  if (
    encodedPayload === undefined ||
    providedSignature === undefined ||
    extra !== undefined
  ) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedDigest = Buffer.from(providedSignature, "base64url");
  const expectedDigest = Buffer.from(expectedSignature, "base64url");
  if (
    providedDigest.length !== expectedDigest.length ||
    !timingSafeEqual(providedDigest, expectedDigest)
  ) {
    return null;
  }

  try {
    const parsedPayload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    );
    if (!isSessionPayload(parsedPayload)) {
      return null;
    }
    if (
      parsedPayload.namespaceId !== PRIVATE_NAMESPACE_ID ||
      parsedPayload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return { user: { id: parsedPayload.namespaceId } };
  } catch {
    return null;
  }
};

export const clearPassphraseSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
};
