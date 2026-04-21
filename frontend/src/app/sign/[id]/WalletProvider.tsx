"use client";

import { type ReactNode, useEffect, useState } from "react";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

let initialized = false;

function initAppKit() {
  if (initialized || !projectId) return;
  try {
    // Dynamic require to avoid crashing at module parse time on mobile
    const { createAppKit } = require("@reown/appkit/react");
    const { SolanaAdapter } = require("@reown/appkit-adapter-solana/react");
    const { solana } = require("@reown/appkit/networks");

    createAppKit({
      adapters: [new SolanaAdapter()],
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
  } catch (e) {
    console.error("Failed to initialize AppKit:", e);
  }
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAppKit();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0D0B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6B6180",
        fontSize: 14,
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}>
        loading...
      </div>
    );
  }

  return <>{children}</>;
}
