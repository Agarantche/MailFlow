import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Karla } from "next/font/google";

import "@/frontend/styles/globals.css";

const sans = Karla({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "MailFlow — Inbox calm before your coffee",
  description: "AI-powered Gmail triage, analysis, and reply drafting."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      data-mf-theme="light"
      lang="en"
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
