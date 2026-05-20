import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { connection } from "next/server";
import { Toaster } from "@/components/primitives/Toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/lib/api/providers";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ModalHost } from "@/lib/modals/host";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "ChurchFlow",
	description: "Record tithes, offerings, and giving for your church.",
};

export default async ({ children }: { children: React.ReactNode }) => {
	// Nonce-based CSP needs request-time rendering so Next can attach the
	// per-request nonce to its generated inline scripts.
	await connection();

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
				geist.variable,
			)}
			suppressHydrationWarning
		>
			<head>
				<script
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
				<ThemeProvider>
					<TooltipProvider>
						<AuthProvider>
							<QueryProvider>
								{children}
								<ModalHost />
								<Toaster />
							</QueryProvider>
						</AuthProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
};
