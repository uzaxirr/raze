"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Connection,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

interface TxData {
  id: string;
  transaction: string;
  type: string;
  amount?: string;
  to?: string;
  fromToken?: string;
  toToken?: string;
  network: string;
  expiresAt: number;
}

type PageState =
  | "loading"
  | "details"
  | "signing"
  | "success"
  | "expired"
  | "error";

interface DetectedWallet {
  name: string;
  icon: string;
  provider: any;
}

function getWallets(): DetectedWallet[] {
  if (typeof window === "undefined") return [];
  const wallets: DetectedWallet[] = [];
  const w = window as any;

  if (w.phantom?.solana?.isPhantom) {
    wallets.push({ name: "Phantom", icon: "👻", provider: w.phantom.solana });
  }
  if (w.backpack?.isBackpack) {
    wallets.push({ name: "Backpack", icon: "🎒", provider: w.backpack });
  }
  if (w.solflare?.isSolflare) {
    wallets.push({ name: "Solflare", icon: "🔆", provider: w.solflare });
  }
  // Jupiter wallet injects as window.jupiter
  if (w.jupiter?.isJupiter) {
    wallets.push({ name: "Jupiter", icon: "🪐", provider: w.jupiter });
  }

  return wallets;
}

export default function SignPage() {
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<PageState>("loading");
  const [txData, setTxData] = useState<TxData | null>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<DetectedWallet | null>(null);
  const [pubkey, setPubkey] = useState("");

  // Detect wallets on mount
  useEffect(() => {
    // Small delay for wallet extensions to inject
    const t = setTimeout(() => setWallets(getWallets()), 300);
    return () => clearTimeout(t);
  }, []);

  // Fetch transaction
  useEffect(() => {
    async function fetchTx() {
      try {
        const res = await fetch(`/api/sign?id=${id}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
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
        setTxData(data);
        setState("details");
      } catch {
        setState("error");
        setError("network error");
      }
    }
    fetchTx();
  }, [id]);

  // Countdown
  useEffect(() => {
    if (!txData) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((txData.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setState("expired");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [txData]);

  const handleConnect = useCallback(async (wallet: DetectedWallet) => {
    try {
      const resp = await wallet.provider.connect();
      const key = resp.publicKey?.toBase58?.() || resp.publicKey?.toString?.() || "";
      setPubkey(key);
      setConnectedWallet(wallet);
    } catch {
      // user rejected
    }
  }, []);

  const handleSign = useCallback(async () => {
    if (!txData || !connectedWallet) return;

    setState("signing");
    try {
      const rpcUrl =
        txData.network === "devnet"
          ? "https://api.devnet.solana.com"
          : process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
      const connection = new Connection(rpcUrl);
      const txBytes = Buffer.from(txData.transaction, "base64");

      let sig: string;
      const provider = connectedWallet.provider;

      // Detect transaction type from first byte
      // Versioned transactions start with a version prefix byte (0x80 for v0)
      const isVersioned = txBytes[0] & 0x80;

      if (isVersioned) {
        const vtx = VersionedTransaction.deserialize(txBytes);
        const signed = await provider.signTransaction(vtx);
        sig = await connection.sendRawTransaction(signed.serialize());
      } else {
        const ltx = Transaction.from(txBytes);
        const signed = await provider.signTransaction(ltx);
        sig = await connection.sendRawTransaction(signed.serialize());
      }

      setSignature(sig);
      setState("success");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "signing failed");
    }
  }, [txData, connectedWallet]);

  const txLabel = txData
    ? txData.type === "swap"
      ? `Swap ${txData.amount || ""} ${txData.fromToken || ""} → ${txData.toToken || ""}`
      : txData.type === "sol_transfer"
        ? `Send ${txData.amount || ""} SOL`
        : txData.type === "token_transfer"
          ? `Send ${txData.amount || ""} ${txData.fromToken || "tokens"}`
          : "Transaction"
    : "";

  const explorerUrl = signature
    ? `https://solscan.io/tx/${signature}${txData?.network === "devnet" ? "?cluster=devnet" : ""}`
    : "";

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0B14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'Space Grotesk', 'DM Sans', -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/imp-expressions/waving.png" alt="Raze" style={{ width: 40, height: 40, objectFit: "contain" }} />
          <span style={{ fontSize: 24, fontWeight: 700, color: "#F0ECF9", letterSpacing: "-0.03em" }}>raze</span>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", background: "#1A1725", borderRadius: 20,
          border: "1px solid #2A2540", padding: 32,
          display: "flex", flexDirection: "column", gap: 20,
        }}>

          {state === "loading" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 16 }}>loading transaction...</div>
          )}

          {state === "expired" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#FF6B6B" }}>transaction expired</div>
              <div style={{ fontSize: 14, color: "#6B6180", marginTop: 8, lineHeight: 1.5 }}>
                go back to telegram and try again.
              </div>
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#FF6B6B" }}>something went wrong</div>
              <div style={{ fontSize: 14, color: "#6B6180", marginTop: 8 }}>{error}</div>
            </div>
          )}

          {state === "details" && txData && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#6B6180", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  sign transaction
                </span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: timeLeft < 30 ? "#FF6B6B" : "#6B6180" }}>
                  {timeLeft}s
                </span>
              </div>

              <div style={{ background: "#12101A", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#F0ECF9" }}>{txLabel}</div>
                {txData.to && <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#6B6180" }}>to: {txData.to}</div>}
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#6B6180" }}>network: {txData.network}</div>
              </div>

              {!connectedWallet ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 14, color: "#6B6180", textAlign: "center" }}>connect your wallet to sign</div>
                  {wallets.map((w) => (
                    <button key={w.name} onClick={() => handleConnect(w)} style={{
                      width: "100%", padding: "14px 20px", borderRadius: 12,
                      border: "1px solid #2A2540", background: "#12101A",
                      color: "#F0ECF9", fontSize: 16, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                      fontFamily: "inherit",
                    }}>
                      <span style={{ fontSize: 20 }}>{w.icon}</span>
                      {w.name}
                    </button>
                  ))}
                  {wallets.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 14, color: "#6B6180", textAlign: "center", padding: 8 }}>
                        open this page in your wallet app:
                      </div>
                      <a href={`https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`}
                        style={{
                          width: "100%", padding: "14px 20px", borderRadius: 12,
                          border: "1px solid #2A2540", background: "#12101A",
                          color: "#F0ECF9", fontSize: 16, fontWeight: 600,
                          textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                          fontFamily: "inherit",
                        }}>
                        <span style={{ fontSize: 20 }}>👻</span> Open in Phantom
                      </a>
                      <a href={`https://backpack.app/ul/browse/${encodeURIComponent(window.location.href)}`}
                        style={{
                          width: "100%", padding: "14px 20px", borderRadius: 12,
                          border: "1px solid #2A2540", background: "#12101A",
                          color: "#F0ECF9", fontSize: 16, fontWeight: 600,
                          textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                          fontFamily: "inherit",
                        }}>
                        <span style={{ fontSize: 20 }}>🎒</span> Open in Backpack
                      </a>
                      <a href={`https://jup.ag/browse/${encodeURIComponent(window.location.href)}`}
                        style={{
                          width: "100%", padding: "14px 20px", borderRadius: 12,
                          border: "1px solid #2A2540", background: "#12101A",
                          color: "#F0ECF9", fontSize: 16, fontWeight: 600,
                          textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                          fontFamily: "inherit",
                        }}>
                        <span style={{ fontSize: 20 }}>🪐</span> Open in Jupiter
                      </a>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                        style={{
                          width: "100%", padding: "14px 20px", borderRadius: 12,
                          border: "1px solid #2A2540", background: "#12101A",
                          color: "#6B6180", fontSize: 14, fontWeight: 500,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                        or copy link to paste in any wallet browser
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={handleSign} style={{
                    width: "100%", padding: "16px 20px", borderRadius: 12,
                    border: "none", background: "#9945FF", color: "#fff",
                    fontSize: 18, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", letterSpacing: "-0.01em",
                  }}>
                    sign & send
                  </button>
                  <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#6B6180", textAlign: "center" }}>
                    {connectedWallet.icon} {connectedWallet.name}: {pubkey.slice(0, 8)}...{pubkey.slice(-4)}
                  </div>
                </>
              )}
            </>
          )}

          {state === "signing" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 16 }}>waiting for wallet approval...</div>
          )}

          {state === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#14F195" }}>transaction sent</div>
              <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#6B6180", marginTop: 12, wordBreak: "break-all" }}>
                {signature.slice(0, 20)}...{signature.slice(-20)}
              </div>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-block", marginTop: 16, padding: "10px 24px",
                  borderRadius: 10, background: "#12101A", border: "1px solid #2A2540",
                  color: "#9945FF", fontSize: 14, fontWeight: 600, textDecoration: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  view on solscan →
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: "#3A3550", textAlign: "center" }}>
          raze.fun — everything solana inside one chat
        </div>
      </div>
    </div>
  );
}
