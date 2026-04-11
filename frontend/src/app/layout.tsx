import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raze — Your On-Chain Intelligence",
  description:
    "Trade, research, and explore Solana through natural conversation. Your wallet, your trades, your alpha — all in one Telegram chat.",
  // Favicon + Apple touch icon are auto-wired by Next.js via the
  // file-based convention: src/app/icon.png and src/app/apple-icon.png.
  metadataBase: new URL("https://raze.fun"),
  openGraph: {
    title: "Raze — Your crypto friend who never sleeps",
    description: "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
    siteName: "Raze",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raze — Your crypto friend who never sleeps",
    description: "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
