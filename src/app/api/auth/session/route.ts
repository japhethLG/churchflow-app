import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";

export async function POST(req: NextRequest) {
  const { idToken } = (await req.json()) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const claims = decoded as typeof decoded & {
      isSuperAdmin?: boolean;
      tenantMemberships?: Record<string, { memberId: string; role: "ADMIN" | "USER" }>;
    };

    // Return the normalised session shape so clients can drive the
    // landing redirect (e.g. signInWithGoogle) without a second
    // round-trip to the backend.
    const response = NextResponse.json({
      uid: decoded.uid,
      email: decoded.email ?? null,
      isSuperAdmin: Boolean(claims.isSuperAdmin),
      tenantMemberships: claims.tenantMemberships ?? {},
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Session creation failed", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
