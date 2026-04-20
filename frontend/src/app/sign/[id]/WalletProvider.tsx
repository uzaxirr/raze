"use client";

import { type ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

export default function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <UnifiedWalletProvider
          wallets={wallets}
          config={{
            autoConnect: false,
            env: "mainnet-beta",
            metadata: {
              name: "Raze",
              description: "Everything Solana in one chat",
              url: "https://raze.fun",
              iconUrls: ["https://raze.fun/assets/imp-expressions/waving.png"],
            },
            theme: "dark",
          }}
        >
          {children}
        </UnifiedWalletProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
