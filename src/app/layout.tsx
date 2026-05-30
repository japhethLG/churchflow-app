import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { Toaster } from "@/components/primitives/Toaster";
import { WebVitalsReporter } from "@/components/telemetry/WebVitalsReporter";
import { type Theme, ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/api/providers";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ModalHost } from "@/lib/modals/host";
import { SheetHost } from "@/lib/sheets/host";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "ChurchFlow",
	description: "Record tithes, offerings, and giving for your church.",
	applicationName: "ChurchFlow",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "ChurchFlow",
	},
	formatDetection: { telephone: false },
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

export default async ({ children }: { children: React.ReactNode }) => {
	// Nonce-based CSP needs request-time rendering so Next can attach the
	// per-request nonce to its generated inline scripts.
	await connection();

	const cookieStore = await cookies();
	const themeCookie = (cookieStore.get("theme")?.value || "system") as Theme;
	const isDark = themeCookie === "dark";

	const headerList = await headers();
	const _nonce = headerList.get("x-nonce") || undefined;

	return (
		// `scroll-smooth` makes in-page anchor navigation (e.g. landing
		// nav items linking to #features) glide instead of jumping. It's
		// CSS-driven so it works in Server Components too, and the
		// `motion-reduce:scroll-auto` variant respects users who've opted
		// out of motion at the OS level.
		<html
			lang="en"
			className={cn(
				"scroll-smooth motion-reduce:scroll-auto font-sans",
				isDark && "dark",
				geist.variable,
			)}
			data-theme={themeCookie !== "system" ? themeCookie : undefined}
			suppressHydrationWarning
		>
			<head>
				<script
					// nonce={nonce}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: inline blocking script to prevent theme flash
					dangerouslySetInnerHTML={{
						__html: `(function() {
							try {
								var theme = localStorage.getItem('theme') || 'system';
								if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
									document.documentElement.classList.add('dark');
									document.documentElement.setAttribute('data-theme', 'dark');
								} else {
									document.documentElement.classList.remove('dark');
									document.documentElement.setAttribute('data-theme', 'light');
								}
							} catch (e) {}
						})()`,
					}}
				/>
			</head>
			<body>
				<ThemeProvider defaultTheme={themeCookie}>
					<TooltipProvider>
						<AuthProvider>
							<QueryProvider>
								{/* Register the SW in production only. A dev SW
								    persists on localhost and serves a stale app
								    shell / cached cross-origin API responses,
								    breaking BE communication. Test the SW via
								    `npm run start` instead. */}
								<SerwistProvider
									swUrl="/serwist/sw.js"
									disable={process.env.NODE_ENV !== "production"}
								>
									{children}
								</SerwistProvider>
								<ModalHost />
								<SheetHost />
								<WebVitalsReporter />
								<Toaster />
							</QueryProvider>
						</AuthProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
};
