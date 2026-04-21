"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { Connection, VersionedTransaction, Transaction } from "@solana/web3.js";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import { QRCodeSVG } from "qrcode.react";
import { encodeURL } from "@solana/pay";

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
  requestId?: string;
}

type PageState =
  | "loading"
  | "details"
  | "simulating"
  | "signing"
  | "success"
  | "expired"
  | "error";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  msg: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(msg)), ms)
    ),
  ]);
}

/* ── Circular countdown ── */
function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? timeLeft / total : 0;
  const offset = circ * (1 - progress);
  const urgent = timeLeft < 60;
  const color = urgent ? "#CC0000" : "#9945FF";

  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={r} fill="none" stroke="#E4DCFF" strokeWidth="3" />
        <circle
          cx="25" cy="25" r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11, fontWeight: 600, color,
      }}>
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
      </div>
    </div>
  );
}

/* ── Pulsing spinner ── */
function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 0" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#9945FF",
            animation: `signPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-inter), sans-serif" }}>{label}</div>
    </div>
  );
}

export default function SignClient({ id }: { id: string }) {
  const [state, setState] = useState<PageState>("loading");
  const [session, setSession] = useState<SessionData | null>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [signMethod, setSignMethod] = useState<"qr" | "connect">("qr");

  const { isConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  const connected = isConnected;
  const connectedAddress = address || "";
  const walletMismatch = !!(
    connected && session?.walletAddress && connectedAddress &&
    session.walletAddress !== connectedAddress
  );

  // Fetch session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/tma/sign/${id}`);
        if (res.status === 404 || res.status === 410) { setState("expired"); return; }
        if (!res.ok) { setState("error"); setError("failed to load transaction"); return; }
        const data = await res.json();
        if (data.status === "completed") { setState("expired"); return; }
        setSession(data);
        setTotalTime(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        setState("details");
      } catch { setState("error"); setError("network error"); }
    }
    fetchSession();
  }, [id]);

  // Countdown
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) { setState("expired"); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Sign
  const handleSign = useCallback(async () => {
    if (!session || !connected || !walletProvider || walletMismatch) return;
    setState("simulating");
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
      const conn = new Connection(rpcUrl, { commitment: "confirmed" });
      if (!session.unsignedTransaction) throw new Error("No transaction data — session may have expired");

      const txBytes = Uint8Array.from(Buffer.from(session.unsignedTransaction, "base64"));
      let tx: VersionedTransaction | Transaction;
      try { tx = VersionedTransaction.deserialize(txBytes); }
      catch { tx = Transaction.from(txBytes); }

      const simulation = await conn.simulateTransaction(tx as VersionedTransaction);
      if (simulation.value.err) {
        throw new Error(`Transaction would fail: ${JSON.stringify(simulation.value.err)}. Go back to Telegram and try again.`);
      }

      setState("signing");
      const signed = await withTimeout(walletProvider.signTransaction(tx), 60_000, "Signing timed out — please try again.");

      const signedBytes = signed instanceof VersionedTransaction ? signed.serialize() : signed.serialize();
      const signedBase64 = Buffer.from(signedBytes).toString("base64");

      let sig: string;
      if (session.requestId) {
        const execRes = await fetch("https://api.jup.ag/swap/v2/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": process.env.NEXT_PUBLIC_JUPITER_API_KEY || "" },
          body: JSON.stringify({ signedTransaction: signedBase64, requestId: session.requestId }),
        });
        const execData = await execRes.json();
        if (!execRes.ok || !execData.signature) throw new Error(execData.error || "Failed to land transaction");
        sig = execData.signature;
      } else {
        sig = await conn.sendRawTransaction(signedBytes, { skipPreflight: true, maxRetries: 3 });
      }

      setSignature(sig);
      setState("success");
      await fetch(`/api/tma/sign/${id}/complete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", txHash: sig }),
      }).catch(() => {});
    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : "signing failed");
    }
  }, [session, connected, walletProvider, walletMismatch, id]);

  const explorerUrl = signature ? `https://solscan.io/tx/${signature}` : "";
  const typeLabel = session?.type === "swap" ? "Swap" : session?.type === "sol_transfer" ? "Transfer" : "Send";

  return (
    <div className="sp">
      <div className="sp-container">
        {/* Header */}
        <div className="sp-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/imp-expressions/waving.png" alt="Raze" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span className="sp-wordmark">raze</span>
        </div>

        {/* Card */}
        <div className="sp-card">

          {state === "loading" && <Spinner label="loading transaction..." />}

          {state === "expired" && (
            <div className="sp-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div className="sp-title" style={{ color: "#CC0000" }}>session expired</div>
              <p className="sp-sub">go back to telegram and try again</p>
              <a href="tg://resolve?domain=razeaii_bot" className="sp-btn-outline">back to telegram</a>
            </div>
          )}

          {state === "error" && (
            <div className="sp-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div className="sp-title" style={{ color: "#CC0000" }}>something went wrong</div>
              <p className="sp-error-msg">{error}</p>
              <button onClick={() => { setState("details"); setError(""); }} className="sp-btn-outline">try again</button>
            </div>
          )}

          {state === "details" && session && (
            <>
              {/* Type + countdown */}
              <div className="sp-top">
                <div>
                  <div className="sp-type">{typeLabel}</div>
                  <div className="sp-network">{session.network}</div>
                </div>
                <CountdownRing timeLeft={timeLeft} total={totalTime} />
              </div>

              {/* Amounts */}
              <div className="sp-amounts">
                <div className="sp-token">
                  <div className="sp-token-label">you pay</div>
                  <div className="sp-token-amount">{session.inputAmount ?? "—"}</div>
                  <div className="sp-token-symbol">{session.fromSymbol || "—"}</div>
                </div>
                <div className="sp-arrow-wrap">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 9h12M11 5l4 4-4 4" />
                  </svg>
                </div>
                <div className="sp-token">
                  <div className="sp-token-label">you get</div>
                  <div className="sp-token-amount sp-token-green">{session.outputAmount ?? "—"}</div>
                  <div className="sp-token-symbol">{session.toSymbol || "—"}</div>
                </div>
              </div>

              {/* Details */}
              {session.priceImpact && (
                <div className="sp-row">
                  <span>price impact</span>
                  <span style={{ color: Number(session.priceImpact) > 1 ? "#CC0000" : undefined }}>{Number(session.priceImpact).toFixed(4)}%</span>
                </div>
              )}

              {/* Transaction wallet */}
              {session.walletAddress && (
                <div className="sp-tx-wallet">
                  <span>transaction for</span>
                  <span className="sp-tx-wallet-addr">{session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}</span>
                </div>
              )}

              {/* Divider */}
              <div className="sp-divider" />

              {/* Method tabs */}
              <div className="sp-tabs">
                <button
                  className={`sp-tab ${signMethod === "qr" ? "sp-tab-active" : ""}`}
                  onClick={() => setSignMethod("qr")}
                >
                  scan QR
                </button>
                <button
                  className={`sp-tab ${signMethod === "connect" ? "sp-tab-active" : ""}`}
                  onClick={() => setSignMethod("connect")}
                >
                  connect wallet
                </button>
              </div>

              {/* QR Code */}
              {signMethod === "qr" && (
                <div className="sp-qr-section">
                  <div className="sp-qr-box">
                    <QRCodeSVG
                      value={encodeURL({
                        link: new URL(`${typeof window !== "undefined" ? window.location.origin : "https://raze.fun"}/api/sign/${id}/pay`),
                      }).toString()}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#1A1A1A"
                      level="M"
                      imageSettings={{
                        src: "/assets/imp-expressions/waving.png",
                        width: 36,
                        height: 36,
                        excavate: true,
                      }}
                    />
                  </div>
                  <div className="sp-qr-hint">scan with your wallet app</div>
                  <div className="sp-qr-wallets">phantom &middot; jupiter &middot; backpack &middot; solflare</div>
                </div>
              )}

              {/* Connect wallet */}
              {signMethod === "connect" && (
                <>
                  {!connected ? (
                    <div className="sp-wallet-section">
                      <appkit-button />
                    </div>
                  ) : walletMismatch ? (
                    <div className="sp-mismatch">
                      <div className="sp-mismatch-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M8 1l7 14H1L8 1z" /><line x1="8" y1="6" x2="8" y2="9" /><circle cx="8" cy="11.5" r="0.5" fill="#CC0000" />
                        </svg>
                      </div>
                      <div>
                        <div className="sp-mismatch-title">wrong wallet connected</div>
                        <div className="sp-mismatch-addrs">
                          connected: <strong>{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</strong>
                          <br />
                          expected: <strong>{session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}</strong>
                        </div>
                      </div>
                      <div className="sp-mismatch-action">
                        <appkit-button />
                      </div>
                    </div>
                  ) : (
                    <div className="sp-wallet-section">
                      <div className="sp-connected">
                        <div className="sp-connected-left">
                          <div className="sp-dot" />
                          <span>{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</span>
                        </div>
                        <appkit-button />
                      </div>
                      <button onClick={handleSign} className="sp-btn-primary">sign & send</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {state === "simulating" && <Spinner label="simulating transaction..." />}
          {state === "signing" && <Spinner label="approve in your wallet app..." />}

          {state === "success" && (
            <div className="sp-center">
              <div className="sp-success-check">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#14F195" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 14l6 6L22 8" />
                </svg>
              </div>
              <div className="sp-title" style={{ color: "#14F195" }}>transaction sent</div>
              <div className="sp-sig">{signature.slice(0, 16)}...{signature.slice(-16)}</div>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="sp-btn-outline">
                  view on solscan
                </a>
              )}
              <a href="tg://resolve?domain=razeaii_bot" className="sp-btn-ghost">back to telegram</a>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="sp-footer">raze.fun &middot; @raze_aii</p>
      </div>

      <style>{`
        @keyframes signPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes spFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }

        .sp {
          min-height: 100vh;
          background: linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: var(--font-space-grotesk), sans-serif;
        }
        .sp-container {
          width: 100%; max-width: 400px;
          display: flex; flex-direction: column; gap: 14px; align-items: center;
          animation: spFadeIn 0.4s ease both;
        }
        .sp-header { display: flex; align-items: center; gap: 8px; }
        .sp-wordmark {
          font-size: 20px; font-weight: 700; color: #1A1A1A;
          letter-spacing: -0.03em;
        }

        .sp-card {
          width: 100%;
          background: #fff;
          border-radius: 20px;
          border: 1px solid #E4DCFF;
          padding: 24px;
          display: flex; flex-direction: column; gap: 14px;
          box-shadow: 0 4px 24px rgba(153,69,255,0.06);
        }

        .sp-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .sp-type { font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em; }
        .sp-network {
          display: inline-block; margin-top: 4px;
          font-size: 10px; font-weight: 600; color: #9945FF;
          background: rgba(153,69,255,0.08); border: 1px solid rgba(153,69,255,0.15);
          border-radius: 4px; padding: 2px 8px;
          text-transform: uppercase; letter-spacing: 0.08em;
          font-family: var(--font-jetbrains-mono), monospace;
        }

        .sp-amounts {
          display: flex; align-items: center;
          background: #FAFAFE; border-radius: 14px; padding: 20px 16px;
          border: 1px solid #F0EDFF;
        }
        .sp-token { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
        .sp-token-label {
          font-size: 10px; color: #999; text-transform: uppercase;
          letter-spacing: 0.08em; font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-token-amount { font-size: 22px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em; }
        .sp-token-green { color: #14F195; }
        .sp-token-symbol { font-size: 13px; font-weight: 600; color: #9945FF; }
        .sp-arrow-wrap {
          width: 32px; height: 32px; border-radius: 50%;
          background: #fff; border: 1px solid #E4DCFF;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .sp-row {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #999; padding: 0 4px;
          font-family: var(--font-jetbrains-mono), monospace;
        }

        .sp-tx-wallet {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 11px; color: #999; padding: 0 4px;
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-tx-wallet-addr { color: #1A1A1A; font-weight: 500; }

        .sp-divider { height: 1px; background: #F0EDFF; margin: 2px 0; }

        .sp-tabs {
          display: flex; gap: 4px;
          background: #F0EDFF; border-radius: 10px; padding: 3px;
        }
        .sp-tab {
          flex: 1; padding: 8px 12px; border-radius: 8px;
          border: none; background: transparent; color: #999;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .sp-tab-active { background: #fff; color: #1A1A1A; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .sp-qr-section {
          display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0;
        }
        .sp-qr-box {
          background: #fff; border-radius: 16px; padding: 16px;
          border: 1px solid #F0EDFF; box-shadow: 0 2px 8px rgba(153,69,255,0.06);
        }
        .sp-qr-hint { font-size: 13px; color: #1A1A1A; font-weight: 500; }
        .sp-qr-wallets { font-size: 11px; color: #BBB; font-family: var(--font-jetbrains-mono), monospace; }

        .sp-wallet-section { display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .sp-connected {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
        }
        .sp-connected-left {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #1A1A1A; font-weight: 500;
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #14F195; box-shadow: 0 0 6px rgba(20,241,149,0.4);
        }

        .sp-mismatch {
          width: 100%;
          background: rgba(204,0,0,0.04); border: 1px solid rgba(204,0,0,0.12);
          border-radius: 12px; padding: 14px;
          display: flex; flex-direction: column; gap: 8px; align-items: center;
        }
        .sp-mismatch-icon { flex-shrink: 0; }
        .sp-mismatch-title { font-size: 13px; font-weight: 700; color: #CC0000; }
        .sp-mismatch-addrs {
          font-size: 11px; color: #999; line-height: 1.8; text-align: center;
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-mismatch-addrs strong { color: #1A1A1A; font-weight: 600; }
        .sp-mismatch-action { margin-top: 4px; }

        .sp-btn-primary {
          width: 100%; padding: 14px 16px; border-radius: 9999px;
          border: none; background: #9945FF; color: #fff;
          font-size: 16px; font-weight: 700; cursor: pointer;
          font-family: inherit; letter-spacing: -0.01em;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .sp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(153,69,255,0.25); }
        .sp-btn-primary:active { transform: translateY(0); }

        .sp-btn-outline {
          display: block; width: 100%; padding: 12px 20px;
          border-radius: 9999px; border: 1px solid #E4DCFF;
          background: #fff; color: #9945FF;
          font-size: 13px; font-weight: 600; text-decoration: none;
          text-align: center; font-family: inherit; cursor: pointer;
          transition: border-color 0.15s;
        }
        .sp-btn-outline:hover { border-color: #9945FF; }

        .sp-btn-ghost {
          display: block; width: 100%; padding: 10px 20px;
          border: none; background: transparent; color: #999;
          font-size: 13px; text-decoration: none; text-align: center;
          font-family: inherit; cursor: pointer;
        }
        .sp-btn-ghost:hover { color: #666; }

        .sp-center {
          display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0;
        }
        .sp-title { font-size: 18px; font-weight: 700; color: #1A1A1A; }
        .sp-sub { font-size: 13px; color: #999; margin: 0; }
        .sp-error-msg {
          font-size: 12px; color: #999; text-align: center; line-height: 1.5;
          max-width: 300px; word-break: break-word;
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-success-check {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(20,241,149,0.1); display: flex;
          align-items: center; justify-content: center;
        }
        .sp-sig {
          font-size: 11px; color: #999; word-break: break-all; text-align: center;
          font-family: var(--font-jetbrains-mono), monospace;
        }
        .sp-footer {
          font-size: 12px; color: #BBB; margin: 0;
          font-family: var(--font-jetbrains-mono), monospace;
        }
      `}</style>
    </div>
  );
}
