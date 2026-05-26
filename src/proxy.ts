import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

// Middleware does two things:
//   1. Cookie-presence gating. Role enforcement (admin/member/super-admin)
//      lives in layout.tsx files so Server Components can rely on
//      `getSessionUser()` returning the expected shape for the URL.
//   2. Per-request CSP with a fresh nonce. Static-shape headers
//      (HSTS, X-Frame-Options, Permissions-Policy, …) are set in
//      next.config.ts; CSP has to live here because the nonce changes
//      per request.
// Public, unauthenticated-accessible paths. The landing page (`/`),
// legal pages, login, invitations, and logout all need to render
// without a session cookie present.
const PUBLIC_PATHS = ["/login", "/invite", "/logout", "/privacy", "/terms"];

// `/` is special-cased below because every other path matches as a
// prefix and `/` would gobble all of them.
const PUBLIC_EXACT_PATHS = new Set(["/"]);

const apiBaseUrl =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

const buildCsp = (nonce: string, isDev: boolean): string => {
	// 'strict-dynamic' lets the nonce'd Next.js loader scripts spawn
	// further scripts without re-listing every CDN host. Whitelist hosts
	// in script-src are ignored when 'strict-dynamic' is present, but
	// browsers that ignore 'strict-dynamic' (older mobile WebViews) still
	// need the explicit list — keep apis.google.com / www.gstatic.com.
	//
	// 'unsafe-inline' on style-src is the pragmatic carve-out: UI
	// libraries (Radix/base-ui dropdowns, popovers) inject inline `style`
	// *attributes* for positioning, and CSP can't distinguish those from
	// `<style>` tag injection. Removing 'unsafe-inline' here breaks
	// every floating UI component. Style-tag injection is a much
	// narrower attack surface than script execution.
	//
	// 'unsafe-eval' in script-src is dev-only — React's dev runtime
	// uses eval() to reconstruct server-side error stacks in the
	// browser. Production has no eval.
	const directives = [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.gstatic.com https://www.googleapis.com${isDev ? " 'unsafe-eval'" : ""}`,
		`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
		`font-src 'self' https://fonts.gstatic.com data:`,
		`img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://www.gstatic.com`,
		`connect-src 'self' ${apiBaseUrl} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com`,
		`frame-src 'self' https://accounts.google.com https://*.firebaseapp.com`,
		// PWA: the service worker runs in a worker context and the
		// browser fetches /manifest.webmanifest separately.
		`worker-src 'self'`,
		`manifest-src 'self'`,
		`object-src 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`frame-ancestors 'none'`,
		`upgrade-insecure-requests`,
	];
	return directives.join("; ");
};

const applyCspHeaders = (
	response: NextResponse,
	nonce: string,
	csp: string,
): void => {
	response.headers.set("Content-Security-Policy", csp);
	response.headers.set("x-nonce", nonce);
};

export const proxy = (req: NextRequest) => {
	const { pathname } = req.nextUrl;
	const hasSession = req.cookies.has(SESSION_COOKIE_NAME);
	const isPublic =
		PUBLIC_EXACT_PATHS.has(pathname) ||
		PUBLIC_PATHS.some((p) => pathname.startsWith(p));

	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

	if (!hasSession && !isPublic) {
		const url = req.nextUrl.clone();
		url.pathname = "/login";
		const response = NextResponse.redirect(url);
		applyCspHeaders(response, nonce, csp);
		return response;
	}

	// Signed in hitting /login → let /launch pick the right destination
	// (rules live in src/app/launch/page.tsx). `/` is the public
	// landing page, so we no longer route through it.
	if (hasSession && pathname === "/login") {
		const url = req.nextUrl.clone();
		url.pathname = "/launch";
		const response = NextResponse.redirect(url);
		applyCspHeaders(response, nonce, csp);
		return response;
	}

	// Pass-through. Forward the nonce to the rendering server (via
	// request header) AND set the CSP on the response (for the browser).
	const requestHeaders = new Headers(req.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set("Content-Security-Policy", csp);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	applyCspHeaders(response, nonce, csp);
	return response;
};

export const config = {
	matcher: [
		// Skip Next internals and our own /api routes. Also skip prefetches:
		// they don't render a fresh page, so the nonce we'd generate would
		// be wasted (and a stale prefetched nonce can cause CSP violations
		// when the link is followed). See Next's CSP guide.
		{
			source:
				"/((?!api|_next/static|_next/image|favicon.ico|serwist|manifest.webmanifest|icons).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
