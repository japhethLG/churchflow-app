import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { QueryProvider } from "@/lib/api/providers";
import { ModalHost } from "@/lib/modals/host";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChurchFlow",
  description: "Record tithes, offerings, and giving for your church.",
};

export default ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <QueryProvider>
            {children}
            <ModalHost />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
