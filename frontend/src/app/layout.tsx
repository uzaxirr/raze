import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import "./globals.css";

const vanillaDreamers = localFont({
  src: "./fonts/VanillaDreamers.otf",
  variable: "--font-vanilla",
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raze — Your On-Chain Intelligence",
  description:
    "Trade, research, and explore Solana through natural conversation. Your wallet, your trades, your alpha — all in one Telegram chat.",
  metadataBase: new URL("https://raze.fun"),
  openGraph: {
    title: "Raze — Everything Solana inside one chat",
    description:
      "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
    siteName: "Raze",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raze — Everything Solana inside one chat",
    description:
      "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${vanillaDreamers.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
