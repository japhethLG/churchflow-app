import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { QueryProvider } from "@/lib/api/providers";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ModalHost } from "@/lib/modals/host";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "ChurchFlow",
	description: "Record tithes, offerings, and giving for your church.",
};

import { Toaster } from "@/components/primitives/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default ({ children }: { children: React.ReactNode }) => {
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
