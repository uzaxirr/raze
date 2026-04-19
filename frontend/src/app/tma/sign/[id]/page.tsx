"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import {
  Connection,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";
import type { Provider } from "@reown/appkit-adapter-solana/react";

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

type PageState = "loading" | "details" | "signing" | "simulating" | "success" | "expired" | "error";

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

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
    if (!session || !isConnected || !walletProvider) return;

    // Wallet address verification — only check if the session has a specific external wallet set
    // Skip check if walletAddress is empty or matches the connected wallet
    if (session.walletAddress && address && session.walletAddress !== address) {
      // Show warning but don't block — user may have multiple wallets
      console.warn(`Connected wallet ${address} differs from expected ${session.walletAddress}`);
    }

    setState("simulating");
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
      const conn = new Connection(rpcUrl, { commitment: "confirmed" });

      if (!session.unsignedTransaction) {
        throw new Error("No unsigned transaction in session — it may have expired");
      }

      const txBytes = Uint8Array.from(Buffer.from(session.unsignedTransaction, "base64"));

      // Deserialize — try versioned first (Jupiter uses v0), fall back to legacy
      let tx: VersionedTransaction | Transaction;
      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(txBytes);
      }

      // Fix 4: Simulate transaction before signing
      const simulation = await conn.simulateTransaction(tx as VersionedTransaction);
      if (simulation.value.err) {
        throw new Error(`Transaction would fail: ${JSON.stringify(simulation.value.err)}. The swap may have expired — go back and try again.`);
      }

      setState("signing");

      // Fix 2: Use sendTransaction (atomic sign + send) with timeout
      const sig = await withTimeout(
        walletProvider.sendTransaction(tx, conn as any),
        60_000,
        "Transaction signing timed out. The wallet may have been closed — please try again."
      );

      setSignature(sig);
      setState("success");

      // Notify backend
      await fetch(`/api/tma/sign/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", txHash: sig }),
      });

      // Show success, then offer to return to Telegram
      setTimeout(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.showAlert?.("Transaction sent!");
          tg.openTelegramLink?.("https://t.me/razeaii_bot");
        }
      }, 2000);

    } catch (e: any) {
      setState("error");
      setError(e?.message || "signing failed");
    }
  }, [session, isConnected, walletProvider, address, id]);

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
              <div style={{ fontSize: 13, color: "#6B6180", marginTop: 6, lineHeight: 1.5 }}>{error}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {error.includes("Wrong wallet") && (
                  <div style={{ marginBottom: 4 }}>
                    <appkit-button />
                  </div>
                )}
                <button
                  onClick={() => { setState("details"); setError(""); }}
                  style={{
                    padding: "10px 20px", borderRadius: 8,
                    border: "1px solid #2A2540", background: "#12101A",
                    color: "#9945FF", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                  try again
                </button>
              </div>
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

              {/* Wallet connect / sign */}
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

          {state === "simulating" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 14, padding: 16 }}>
              simulating transaction...
            </div>
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
              <button
                onClick={() => {
                  const tg = (window as any).Telegram?.WebApp;
                  tg?.openTelegramLink?.("https://t.me/razeaii_bot");
                }}
                style={{
                  display: "block", marginTop: 12, padding: "10px 20px",
                  borderRadius: 8, border: "1px solid #2A2540", background: "#12101A",
                  color: "#6B6180", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit", width: "100%",
                }}>
                back to telegram
              </button>
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
