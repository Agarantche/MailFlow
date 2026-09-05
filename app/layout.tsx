import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/frontend/styles/globals.css";

const sans = localFont({
  src: [
    { path: "../public/fonts/cabinet-grotesk-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/cabinet-grotesk-medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/cabinet-grotesk-bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/cabinet-grotesk-extrabold.woff2", weight: "800", style: "normal" }
  ],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "MailFlow — Less inbox. More life.",
  description: "A little room to breathe. Bring clarity to your inbox, find your next step, and make space for your day."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={sans.variable}
      data-mf-theme="light"
      lang="en"
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
