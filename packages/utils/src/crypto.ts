import crypto from 'crypto';

// Generate a random string
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Generate a random numeric code
export function generateNumericCode(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

// Simple hash (not for passwords)
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Generate secure token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Constant time comparison to prevent timing attacks
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Still do comparison to avoid leaking length info
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
