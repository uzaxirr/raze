"use client";

import { type ReactNode, useEffect, useState } from "react";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

let initialized = false;
let initError: string | null = null;

function initAppKit() {
  if (initialized) return;
  if (!projectId) {
    initError = "Missing NEXT_PUBLIC_REOWN_PROJECT_ID";
    console.error("[WalletProvider]", initError);
    return;
  }
  try {
    console.log("[WalletProvider] Importing AppKit modules...");
    const { createAppKit } = require("@reown/appkit/react");
    console.log("[WalletProvider] createAppKit imported");
    const { SolanaAdapter } = require("@reown/appkit-adapter-solana/react");
    console.log("[WalletProvider] SolanaAdapter imported");
    const { solana } = require("@reown/appkit/networks");
    console.log("[WalletProvider] solana network imported");

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
    console.log("[WalletProvider] AppKit initialized successfully");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    initError = msg;
    console.error("[WalletProvider] AppKit init failed:", msg);
    if (e instanceof Error && e.stack) {
      console.error("[WalletProvider] Stack:", e.stack);
    }
  }
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[WalletProvider] useEffect running, initialized:", initialized);
    initAppKit();
    if (initError) {
      setError(initError);
    }
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
        loading wallet...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0D0B14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FF6B6B" }}>
          wallet connection failed
        </div>
        <div style={{
          fontSize: 12,
          color: "#6B6180",
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.6,
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}>
          {error}
        </div>
        <div style={{ fontSize: 12, color: "#6B6180", marginTop: 8 }}>
          projectId: {projectId ? `${projectId.slice(0, 8)}...` : "NOT SET"}
        </div>
        <button
          onClick={() => { setError(null); initError = null; initialized = false; initAppKit(); if (initError) setError(initError); }}
          style={{
            marginTop: 8,
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #2A2540",
            background: "#12101A",
            color: "#9945FF",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
