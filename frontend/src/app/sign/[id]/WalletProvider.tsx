"use client";

import { type ReactNode } from "react";
import { createAppKit } from "@reown/appkit";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana } from "@reown/appkit/networks";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

// Singleton guard
let initialized = false;

if (!initialized && projectId) {
  const solanaAdapter = new SolanaAdapter({
    wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
  });

  createAppKit({
    adapters: [solanaAdapter],
    networks: [solana],
    projectId,
    metadata: {
      name: "Raze",
      description: "Everything Solana in one chat",
      url: "https://raze.fun",
      icons: ["https://raze.fun/assets/imp-expressions/waving.png"],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
  });
  initialized = true;
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
