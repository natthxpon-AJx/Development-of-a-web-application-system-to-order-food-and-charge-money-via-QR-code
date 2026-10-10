import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

let signingKey;
const SESSION_SECONDS = 8 * 60 * 60;
const credentialVersion = (user) => createHash("sha256").update(user.password_hash).digest("hex");
const key = () => signingKey ||= process.env.AUTH_SECRET || randomBytes(32).toString("hex");

export function publicUser(user) {
  return { id: user.user_id, username: user.username, displayName: user.display_name,
    role: user.role, position: user.position, phone: user.phone, active: !!user.is_active };
}

export function issueSession(user, now = Date.now()) {
  const expiresAt = now + SESSION_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ sub: user.user_id, exp: expiresAt, version: credentialVersion(user) })).toString("base64url");
  const signature = createHmac("sha256", key()).update(payload).digest("base64url");
  return { ...publicUser(user), token: `${payload}.${signature}`, expiresAt };
}

export function verifySession(token, user, now = Date.now()) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) return null;
    const expected = createHmac("sha256", key()).update(parts[0]).digest();
    const actual = Buffer.from(parts[1], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    if (!Number.isInteger(payload.sub) || !Number.isFinite(payload.exp) || payload.exp <= now) return null;
    if (user && (payload.sub !== user.user_id || !user.is_active || payload.version !== credentialVersion(user))) return null;
    return payload;
  } catch { return null; }
}

export function canAccess(user, access) {
  if (user.role === "admin") return true;
  if (access === "authenticated") return ["ครัว", "แคชเชียร์", "เจ้าของร้าน"].includes(user.position);
  if (access === "staff-directory") return user.position === "เจ้าของร้าน";
  if (access === "owner-tools") return user.position === "เจ้าของร้าน";
  if (access === "owner-tools-or-cashier") return ["เจ้าของร้าน", "แคชเชียร์"].includes(user.position);
  return access === "staff" && ["ครัว", "แคชเชียร์"].includes(user.position)
    || access === "kitchen" && user.position === "ครัว"
    || access === "cashier" && user.position === "แคชเชียร์";
}
