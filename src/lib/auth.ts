import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * التحقق من Firebase ID Token على الخادم — بدون firebase-admin.
 * نتحقق من التوقيع عبر مفاتيح Google العامة (JWKS) والـ issuer والـ audience،
 * فلا نحتاج أي سرّ (Service Account) على الخادم.
 */
const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "mohtal-9b1d3";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
}

export async function verifyRequest(req: Request): Promise<AuthUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  try {
    const { payload } = await jwtVerify(match[1], JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (!payload.sub) return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}
