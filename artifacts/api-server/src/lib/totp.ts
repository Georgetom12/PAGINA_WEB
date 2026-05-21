/**
 * PSY Platform — TOTP RFC 6238 / RFC 4226 (sin dependencias externas)
 * Compartido entre vault.ts y free-auth.ts (verificación 2FA de superadmin)
 */
import { createHmac, randomBytes } from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(byteLen = 20): string {
  const bytes = randomBytes(byteLen);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i + 4 < bits.length; i += 5) {
    result += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return result;
}

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const byteArr: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    byteArr.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(byteArr);
}

export function generateTOTP(secret: string, windowOffset = 0): string {
  const key     = base32ToBuffer(secret);
  const counter = Math.floor(Date.now() / 30000) + windowOffset;
  const buf     = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000) >>> 0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac   = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset]     & 0x7f) << 24 |
     (hmac[offset + 1] & 0xff) << 16 |
     (hmac[offset + 2] & 0xff) << 8  |
     (hmac[offset + 3] & 0xff)) % 1_000_000;
  return code.toString().padStart(6, "0");
}

export function verifyTOTP(token: string, secret: string): boolean {
  for (const w of [-1, 0, 1]) {
    if (generateTOTP(secret, w) === token) return true;
  }
  return false;
}

export function otpauthURI(secret: string, user: string, issuer: string): string {
  const params = new URLSearchParams({
    secret, issuer, algorithm: "SHA1", digits: "6", period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user)}?${params}`;
}
