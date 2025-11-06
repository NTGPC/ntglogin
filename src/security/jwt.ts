import { SignJWT, jwtVerify, JWTPayload } from "jose";

import fs from "node:fs";

import path from "node:path";

import crypto from "node:crypto";



/**

 * Dùng RS256 (RSA keypair). Đọc key từ file path trong ENV:

 *  - JWT_PRIVATE_KEY_PATH

 *  - JWT_PUBLIC_KEY_PATH

 * Dev có thể fallback sang JWT_SECRET (HS256) nếu cần, nhưng prod KHÔNG NÊN.

 */



const PRIV_PATH = process.env.JWT_PRIVATE_KEY_PATH;

const PUB_PATH  = process.env.JWT_PUBLIC_KEY_PATH;

const ALG = "RS256";



function readKeyMaybe(p?: string): Buffer | undefined {

  if (!p) return undefined;

  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);

  return fs.readFileSync(abs);

}



const privateKeyPem = readKeyMaybe(PRIV_PATH);

const publicKeyPem  = readKeyMaybe(PUB_PATH);



if (!privateKeyPem || !publicKeyPem) {

  console.warn("[jwt] Missing RSA keys. For production, set JWT_PRIVATE_KEY_PATH & JWT_PUBLIC_KEY_PATH.");

}



export type AccessClaims = {

  role: "Admin" | "Editor" | "Viewer";

  // add more claims if needed

};



export async function signAccessToken(

  sub: string,

  claims: AccessClaims,

  expiresIn = "15m",

): Promise<string> {

  if (!privateKeyPem) throw new Error("Private key not configured");

  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT(claims as unknown as JWTPayload)

    .setProtectedHeader({ alg: ALG })

    .setSubject(sub)

    .setIssuedAt(now)

    .setExpirationTime(expiresIn)

    .sign(await crypto.createPrivateKey({ key: privateKeyPem, format: "pem" }));

}



export async function signRefreshToken(

  sub: string,

  jti: string,

  expiresIn = "7d",

): Promise<string> {

  if (!privateKeyPem) throw new Error("Private key not configured");

  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({ jti })

    .setProtectedHeader({ alg: ALG })

    .setSubject(sub)

    .setIssuedAt(now)

    .setExpirationTime(expiresIn)

    .sign(await crypto.createPrivateKey({ key: privateKeyPem, format: "pem" }));

}



export async function verifyToken<T = JWTPayload>(token: string): Promise<T & JWTPayload> {

  if (!publicKeyPem) throw new Error("Public key not configured");

  const { payload } = await jwtVerify(

    token,

    await crypto.createPublicKey({ key: publicKeyPem, format: "pem" }),

    { algorithms: [ALG] },

  );

  return payload as T & JWTPayload;

}



/**

 * Refresh rotation gợi ý:

 * - Khi phát refresh token mới => tạo jti mới, lưu vào Redis với TTL == exp.

 * - Khi verify refresh => kiểm tra jti trong Redis còn tồn tại.

 * - Khi rotate => xoá jti cũ, set jti mới.

 * (Viết ở service auth để không buộc jwt.ts phụ thuộc Redis.)

 */

