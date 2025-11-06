import argon2 from "argon2";

/**
 * TUYỆT ĐỐI không dùng MD5/bcrypt cho mật khẩu prod.
 * Argon2id với tham số mạnh (tốn RAM/time để chống brute-force).
 */
const ARGON_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 1 << 16, // ~65 MB
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length < 10) {
    throw new Error("Password must be at least 10 characters.");
  }
  return argon2.hash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

