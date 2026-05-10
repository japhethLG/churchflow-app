import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { connection } from "next/server";
import { Toaster } from "@/components/primitives/Toaster";
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
		<html lang="en" className={cn("font-sans", geist.variable)}>
			<body>
				<TooltipProvider>
					<AuthProvider>
						<QueryProvider>
							{children}
							<ModalHost />
							<Toaster />
						</QueryProvider>
					</AuthProvider>
				</TooltipProvider>
			</body>
		</html>
	);
};
