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
  icons: {
    icon: "/favicon.svg",
  },
  metadataBase: new URL("https://frontend-production-e170.up.railway.app"),
  openGraph: {
    title: "Raze — Your crypto friend who never sleeps",
    description: "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
    siteName: "Raze",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raze — Your crypto friend who never sleeps",
    description: "Trade, research, and explore Solana through natural conversation. All in one Telegram chat.",
    images: ["/og-image.png"],
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
