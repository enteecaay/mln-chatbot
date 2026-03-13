import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { IdleMascot } from "@/components/IdleMascot";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MLN Chatbot",
  description: "Chatbot học tập Mác - Lênin với Supabase auth, lịch sử chat và admin dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased ` }
      >
        {children}
        <IdleMascot />
      </body>
    </html>
  );
}
