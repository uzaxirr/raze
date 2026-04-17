"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

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
  | "connecting"
  | "signing"
  | "success"
  | "expired"
  | "error";

function SigningUI() {
  const params = useParams();
  const id = params.id as string;
  const { connection } = useConnection();
  const { publicKey, connected, connect, select, wallets, signTransaction } =
    useWallet();

  const [state, setState] = useState<PageState>("loading");
  const [txData, setTxData] = useState<TxData | null>(null);
  const [signature, setSignature] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch transaction data
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

  // Countdown timer
  useEffect(() => {
    if (!txData) return;
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((txData.expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setState("expired");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [txData]);

  // Auto-advance to details when wallet connects
  useEffect(() => {
    if (connected && state === "connecting") {
      setState("details");
    }
  }, [connected, state]);

  const handleConnect = useCallback(
    async (walletName: string) => {
      try {
        setState("connecting");
        const adapter = wallets.find((w) => w.adapter.name === walletName);
        if (adapter) {
          select(adapter.adapter.name);
          await connect();
        }
      } catch {
        setState("details");
      }
    },
    [wallets, select, connect]
  );

  const handleSign = useCallback(async () => {
    if (!txData || !signTransaction || !publicKey) return;

    setState("signing");
    try {
      const txBytes = Buffer.from(txData.transaction, "base64");

      let sig: string;

      // Try versioned transaction first, fall back to legacy
      try {
        const vtx = VersionedTransaction.deserialize(txBytes);
        const signed = await signTransaction(vtx as any);
        sig = await connection.sendRawTransaction(
          (signed as VersionedTransaction).serialize()
        );
      } catch {
        const ltx = Transaction.from(txBytes);
        const signed = await signTransaction(ltx as any);
        sig = await connection.sendRawTransaction(
          (signed as Transaction).serialize()
        );
      }

      setSignature(sig);
      setState("success");
    } catch (e: any) {
      setState("error");
      setError(e?.message || "signing failed");
    }
  }, [txData, signTransaction, publicKey, connection]);

  const txLabel = txData
    ? txData.type === "swap"
      ? `Swap ${txData.amount || ""} ${txData.fromToken || ""} → ${txData.toToken || ""}`
      : txData.type === "sol_transfer"
        ? `Send ${txData.amount || ""} SOL to ${txData.to?.slice(0, 8)}...`
        : txData.type === "token_transfer"
          ? `Send ${txData.amount || ""} ${txData.fromToken || "tokens"} to ${txData.to?.slice(0, 8)}...`
          : "Transaction"
    : "";

  const explorerUrl = signature
    ? `https://solscan.io/tx/${signature}${txData?.network === "devnet" ? "?cluster=devnet" : ""}`
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Space Grotesk', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/assets/imp-expressions/waving.png"
            alt="Raze"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#F0ECF9",
              letterSpacing: "-0.03em",
            }}
          >
            raze
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            background: "#1A1725",
            borderRadius: 20,
            border: "1px solid #2A2540",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {state === "loading" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 16 }}>
              loading transaction...
            </div>
          )}

          {state === "expired" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
              <div
                style={{ fontSize: 20, fontWeight: 700, color: "#FF6B6B" }}
              >
                transaction expired
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6B6180",
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                go back to telegram and try again.
                <br />
                transactions expire after ~2 minutes.
              </div>
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <div
                style={{ fontSize: 20, fontWeight: 700, color: "#FF6B6B" }}
              >
                something went wrong
              </div>
              <div
                style={{ fontSize: 14, color: "#6B6180", marginTop: 8 }}
              >
                {error}
              </div>
            </div>
          )}

          {(state === "details" || state === "connecting") && txData && (
            <>
              {/* Timer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#6B6180",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  sign transaction
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: timeLeft < 30 ? "#FF6B6B" : "#6B6180",
                  }}
                >
                  {timeLeft}s
                </span>
              </div>

              {/* TX details */}
              <div
                style={{
                  background: "#12101A",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: "#F0ECF9" }}
                >
                  {txLabel}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#6B6180",
                  }}
                >
                  network: {txData.network}
                </div>
              </div>

              {/* Wallet buttons or Sign button */}
              {!connected ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ fontSize: 14, color: "#6B6180", textAlign: "center" }}
                  >
                    connect your wallet to sign
                  </div>
                  {wallets
                    .filter((w) => w.readyState === "Installed" || w.readyState === "Loadable")
                    .map((w) => (
                      <button
                        key={w.adapter.name}
                        onClick={() => handleConnect(w.adapter.name)}
                        style={{
                          width: "100%",
                          padding: "14px 20px",
                          borderRadius: 12,
                          border: "1px solid #2A2540",
                          background: "#12101A",
                          color: "#F0ECF9",
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          fontFamily: "inherit",
                        }}
                      >
                        {w.adapter.icon && (
                          <img
                            src={w.adapter.icon}
                            alt=""
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                        {w.adapter.name}
                      </button>
                    ))}
                  {wallets.filter(
                    (w) => w.readyState === "Installed" || w.readyState === "Loadable"
                  ).length === 0 && (
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6B6180",
                        textAlign: "center",
                        padding: 16,
                      }}
                    >
                      no wallet detected. install phantom, backpack, or
                      jupiter wallet.
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSign}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "#9945FF",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "-0.01em",
                  }}
                >
                  sign & send
                </button>
              )}

              {connected && publicKey && (
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#6B6180",
                    textAlign: "center",
                  }}
                >
                  connected: {publicKey.toBase58().slice(0, 8)}...
                </div>
              )}
            </>
          )}

          {state === "signing" && (
            <div style={{ textAlign: "center", color: "#6B6180", fontSize: 16 }}>
              waiting for wallet approval...
            </div>
          )}

          {state === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div
                style={{ fontSize: 20, fontWeight: 700, color: "#14F195" }}
              >
                transaction sent
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#6B6180",
                  marginTop: 12,
                  wordBreak: "break-all",
                }}
              >
                {signature.slice(0, 20)}...{signature.slice(-20)}
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 16,
                    padding: "10px 24px",
                    borderRadius: 10,
                    background: "#12101A",
                    border: "1px solid #2A2540",
                    color: "#9945FF",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  view on solscan →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 12,
            color: "#3A3550",
            textAlign: "center",
          }}
        >
          raze.fun — everything solana inside one chat
        </div>
      </div>
    </div>
  );
}

export default function SignPage() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={rpcUrl}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <SigningUI />
      </WalletProvider>
    </ConnectionProvider>
  );
}
