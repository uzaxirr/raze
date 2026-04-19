"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { solana } from "@reown/appkit/networks";
import {
  Connection,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";
import type { Provider } from "@reown/appkit-adapter-solana/react";

// Initialize Solana adapter
const solanaAdapter = new SolanaAdapter();

// Initialize AppKit
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

const metadata = {
  name: "Raze",
  description: "Everything Solana in one chat",
  url: "https://raze.fun",
  icons: ["https://raze.fun/assets/imp-expressions/waving.png"],
};

createAppKit({
  adapters: [solanaAdapter],
  networks: [solana],
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

interface SessionData {
  id: string;
  type: "swap" | "sol_transfer" | "token_transfer";
  unsignedTransaction?: string;
  walletAddress: string;
  network: string;
  status: string;
  expiresAt: number;
  fromSymbol?: string;
  toSymbol?: string;
  inputAmount?: number;
  outputAmount?: number;
  priceImpact?: string;
  toAddress?: string;
}

type PageState = "loading" | "details" | "signing" | "success" | "expired" | "error";

export default function TMASignPage() {
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<PageState>("loading");
  const [session, setSession] = useState<SessionData | null>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const { isConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Expand Telegram Mini App to full height
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.expand();
        tg.ready();
      }
    }
  }, []);

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/tma/sign/${id}`);
        if (res.status === 404 || res.status === 410) {
          setState("expired");
          return;
        }
        if (!res.ok) {
          setState("error");
          setError("failed to load transaction");
          return;
        }
        const data = await res.json();
        setSession(data);
        setState("details");
      } catch {
        setState("error");
        setError("network error");
      }
    }
    fetchSession();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setState("expired");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Sign and send transaction
  const handleSign = useCallback(async () => {
    if (!session || !isConnected || !walletProvider || !connection) return;

    setState("signing");
    try {
      // Fetch a fresh swap transaction from Jupiter with current blockhash
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
      const conn = new Connection(rpcUrl);

      let sig: string;

      if (!session.unsignedTransaction) {
        throw new Error("No unsigned transaction in session — it may have expired");
      }

      const txBytes = Buffer.from(session.unsignedTransaction, "base64");

      // Detect versioned vs legacy from first byte
      const isVersioned = txBytes[0] & 0x80;
      if (isVersioned) {
        const vtx = VersionedTransaction.deserialize(txBytes);
        sig = await walletProvider.sendTransaction(vtx, conn as any);
      } else {
        const ltx = Transaction.from(txBytes);
        sig = await walletProvider.sendTransaction(ltx, conn as any);
      }

      setSignature(sig);
      setState("success");

      // Notify backend
      await fetch(`/api/tma/sign/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", txHash: sig }),
      });

      // Close Mini App after a delay
      setTimeout(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.sendData(JSON.stringify({ status: "completed", txHash: sig }));
          tg.close();
        }
      }, 3000);

    } catch (e: any) {
      setState("error");
      setError(e?.message || "signing failed");
    }
  }, [session, isConnected, walletProvider, connection, address, id]);

  const txLabel = session
    ? session.type === "swap"
      ? `Swap ${session.inputAmount || ""} ${session.fromSymbol || ""} → ${session.toSymbol || ""}`
      : session.type === "sol_transfer"
        ? `Send ${session.inputAmount || ""} SOL`
        : `Send ${session.inputAmount || ""} ${session.fromSymbol || "tokens"}`
    : "";

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const explorerUrl = signature
    ? `https://solscan.io/tx/${signature}`
    : "";

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0B14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Space Grotesk', 'DM Sans', -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/assets/imp-expressions/waving.png" alt="Raze" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#F0ECF9", letterSpacing: "-0.03em" }}>raze</span>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", background: "#1A1725", borderRadius: 16,
          border: "1px solid #2A2540", padding: 24,
          display: "flex", flexDirection: "column", gap: 16,
        }}>

          {state === "loading" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 14 }}>loading...</div>
          )}

          {state === "expired" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⏰</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#FF6B6B" }}>session expired</div>
              <div style={{ fontSize: 13, color: "#6B6180", marginTop: 6 }}>
                go back to telegram and try again
              </div>
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#FF6B6B" }}>something went wrong</div>
              <div style={{ fontSize: 13, color: "#6B6180", marginTop: 6 }}>{error}</div>
            </div>
          )}

          {state === "details" && session && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6B6180", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  sign transaction
                </span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: timeLeft < 60 ? "#FF6B6B" : "#6B6180" }}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div style={{ background: "#12101A", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#F0ECF9" }}>{txLabel}</div>
                {session.outputAmount && (
                  <div style={{ fontSize: 13, color: "#14F195" }}>
                    ≈ {session.outputAmount} {session.toSymbol}
                  </div>
                )}
                {session.priceImpact && (
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B6180" }}>
                    impact: {Number(session.priceImpact).toFixed(4)}%
                  </div>
                )}
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B6180" }}>
                  network: {session.network}
                </div>
              </div>

              {/* Reown AppKit wallet button */}
              {!isConnected ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <appkit-button />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B6180", textAlign: "center" }}>
                    connected: {address?.slice(0, 8)}...{address?.slice(-4)}
                  </div>
                  <button onClick={handleSign} style={{
                    width: "100%", padding: "14px 16px", borderRadius: 10,
                    border: "none", background: "#9945FF", color: "#fff",
                    fontSize: 16, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit",
                  }}>
                    sign & send
                  </button>
                </>
              )}
            </>
          )}

          {state === "signing" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 14, padding: 16 }}>
              waiting for wallet approval...
            </div>
          )}

          {state === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#14F195" }}>transaction sent</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B6180", marginTop: 8, wordBreak: "break-all" }}>
                {signature.slice(0, 20)}...{signature.slice(-20)}
              </div>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-block", marginTop: 12, padding: "8px 20px",
                  borderRadius: 8, background: "#12101A", border: "1px solid #2A2540",
                  color: "#9945FF", fontSize: 13, fontWeight: 600, textDecoration: "none",
                  fontFamily: "monospace",
                }}>
                  view on solscan →
                </a>
              )}
              <div style={{ fontSize: 11, color: "#3A3550", marginTop: 12 }}>
                closing in 3 seconds...
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "#3A3550", textAlign: "center" }}>
          raze.fun — everything solana in one chat
        </div>
      </div>
    </div>
  );
}
