"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import { createQR, encodeURL } from "@solana/pay";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface SessionData {
  id: string;
  type: "swap" | "sol_transfer" | "token_transfer";
  walletAddress: string;
  fromToken: string;
  toToken: string;
  amount: number;
  network: string;
  status: string;
  expiresAt: number;
  referenceKey: string;
  fromSymbol?: string;
  toSymbol?: string;
  outputAmount?: number;
  priceImpact?: string;
  feeAmount?: number;
  feeBps?: number;
  txHash?: string;
}

interface BuildResult {
  unsignedTransaction: string;
  requestId?: string;
  outputAmount?: number;
  priceImpact?: string;
  feeBps?: number;
  feeAmount?: number;
}

type PageState = "loading" | "details" | "building" | "signing" | "submitting" | "success" | "expired" | "error";

/* ── Circular countdown ── */
function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? timeLeft / total : 0;
  const offset = circ * (1 - progress);
  const color = timeLeft < 60 ? "#CC0000" : "#9945FF";
  return (
    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
      <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="25" cy="25" r={r} fill="none" stroke="#E4DCFF" strokeWidth="3" />
        <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, fontWeight: 600, color }}>
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 0" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9945FF",
            animation: `signPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-inter), sans-serif" }}>{label}</div>
    </div>
  );
}

export default function SignClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const viewerToken = searchParams.get("t") || "";

  const [state, setState] = useState<PageState>("loading");
  const [session, setSession] = useState<SessionData | null>(null);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [signMethod, setSignMethod] = useState<"qr" | "connect">("qr");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const connectedAddress = address || "";
  const walletMismatch = !!(
    isConnected && session?.walletAddress && connectedAddress && session.walletAddress !== connectedAddress
  );

  const apiUrl = (path: string) => `${BACKEND_URL}/api/sign/sessions/${id}${path}${path.includes("?") ? "&" : "?"}t=${viewerToken}`;

  // Fetch session intent
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(apiUrl(""));
        if (res.status === 404 || res.status === 410) { setState("expired"); return; }
        if (res.status === 401 || res.status === 403) { setState("error"); setError("invalid or missing access token"); return; }
        if (!res.ok) { setState("error"); setError("failed to load session"); return; }
        const data = await res.json();
        if (data.status === "confirmed" || data.status === "finalized") {
          setSignature(data.txHash || "");
          setState("success");
          return;
        }
        setSession(data);
        setTotalTime(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
        setState("details");
      } catch { setState("error"); setError("network error"); }
    }
    if (viewerToken) fetchSession();
    else { setState("error"); setError("missing access token in URL"); }
  }, [id, viewerToken]);

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

  // Status polling (works for both tabs)
  useEffect(() => {
    if (state !== "details" && state !== "signing" && state !== "submitting") return;
    if (!session?.referenceKey) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl("/status"));
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "confirmed" && data.signature) {
          clearInterval(interval);
          setSignature(data.signature);
          setState("success");
        }
      } catch { /* keep polling */ }
    }, 3000);

    pollingRef.current = interval;
    return () => { clearInterval(interval); pollingRef.current = null; };
  }, [state, session, id, viewerToken]);

  // Build + Sign (WalletConnect path)
  const handleSign = useCallback(async () => {
    if (!session || !isConnected || !walletProvider || walletMismatch) return;

    setState("building");
    try {
      // Step 1: Build fresh transaction on server
      const buildRes = await fetch(apiUrl("/build"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connectedAddress }),
      });
      if (!buildRes.ok) {
        const err = await buildRes.json().catch(() => ({ detail: "build failed" }));
        throw new Error(err.detail || err.error || "failed to build transaction");
      }
      const built: BuildResult = await buildRes.json();
      setBuildResult(built);

      // Update session display with real output
      if (session && built.outputAmount) {
        setSession({ ...session, outputAmount: built.outputAmount, priceImpact: built.priceImpact, feeBps: built.feeBps });
      }

      // Step 2: Deserialize + sign
      setState("signing");
      const txBytes = Uint8Array.from(atob(built.unsignedTransaction), c => c.charCodeAt(0));
      let tx: VersionedTransaction | Transaction;
      try { tx = VersionedTransaction.deserialize(txBytes); }
      catch { tx = Transaction.from(txBytes); }

      const signed = await walletProvider.signTransaction(tx);
      const signedBytes = signed instanceof VersionedTransaction ? signed.serialize() : signed.serialize();
      const signedB64 = btoa(String.fromCharCode(...signedBytes));

      // Step 3: Submit to server (server calls Jupiter /execute)
      setState("submitting");
      const submitRes = await fetch(apiUrl("/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTransaction: signedB64, requestId: built.requestId }),
      });
      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ detail: "submit failed" }));
        throw new Error(err.detail || err.error || "failed to submit transaction");
      }
      const result = await submitRes.json();
      setSignature(result.signature);
      setState("success");

    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : "signing failed");
    }
  }, [session, isConnected, walletProvider, walletMismatch, connectedAddress, id, viewerToken]);

  // QR code
  const qrRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || !id) return;
    node.innerHTML = "";
    try {
      // QR encodes the BACKEND Solana Pay endpoint
      const payUrl = `${BACKEND_URL}/api/sign/sessions/${id}/pay`;
      const solanaUrl = encodeURL({ link: new URL(payUrl), label: "Raze", message: "Sign transaction" });
      const qr = createQR(solanaUrl, 200, "white");
      qr.append(node);
    } catch (e) {
      console.error("[QR] Failed:", e);
    }
  }, [id]);

  const explorerUrl = signature ? `https://solscan.io/tx/${signature}` : "";
  const typeLabel = session?.type === "swap" ? "Swap" : session?.type === "sol_transfer" ? "Transfer" : "Send";
  const displayOutput = buildResult?.outputAmount ?? session?.outputAmount;
  const displayImpact = buildResult?.priceImpact ?? session?.priceImpact;

  return (
    <div className="sp">
      <div className="sp-container">
        <div className="sp-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/imp-expressions/waving.png" alt="Raze" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span className="sp-wordmark">raze</span>
        </div>

        <div className="sp-card">
          {state === "loading" && <Spinner label="loading..." />}

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

          {(state === "details" || state === "building" || state === "signing" || state === "submitting") && session && (
            <>
              <div className="sp-top">
                <div>
                  <div className="sp-type">{typeLabel}</div>
                  <div className="sp-network">{session.network}</div>
                </div>
                <CountdownRing timeLeft={timeLeft} total={totalTime} />
              </div>

              <div className="sp-amounts">
                <div className="sp-token">
                  <div className="sp-token-label">you pay</div>
                  <div className="sp-token-amount">{session.amount ?? "—"}</div>
                  <div className="sp-token-symbol">{session.fromSymbol || session.fromToken || "—"}</div>
                </div>
                <div className="sp-arrow-wrap">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 9h12M11 5l4 4-4 4" />
                  </svg>
                </div>
                <div className="sp-token">
                  <div className="sp-token-label">you get</div>
                  <div className="sp-token-amount sp-token-green">{displayOutput ?? "~"}</div>
                  <div className="sp-token-symbol">{session.toSymbol || session.toToken || "—"}</div>
                </div>
              </div>

              {displayImpact && (
                <div className="sp-row">
                  <span>price impact</span>
                  <span style={{ color: Number(displayImpact) > 1 ? "#CC0000" : undefined }}>{Number(displayImpact).toFixed(4)}%</span>
                </div>
              )}

              {session.walletAddress && (
                <div className="sp-tx-wallet">
                  <span>transaction for</span>
                  <span className="sp-tx-wallet-addr">{session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}</span>
                </div>
              )}

              <div className="sp-divider" />

              {state !== "details" ? (
                <Spinner label={
                  state === "building" ? "building transaction..." :
                  state === "signing" ? "approve in your wallet..." :
                  "submitting transaction..."
                } />
              ) : (
                <>
                  <div className="sp-tabs">
                    <button className={`sp-tab ${signMethod === "qr" ? "sp-tab-active" : ""}`} onClick={() => setSignMethod("qr")}>scan QR</button>
                    <button className={`sp-tab ${signMethod === "connect" ? "sp-tab-active" : ""}`} onClick={() => setSignMethod("connect")}>connect wallet</button>
                  </div>

                  {signMethod === "qr" && (
                    <div className="sp-qr-section">
                      <div className="sp-qr-box" ref={qrRef} />
                      <div className="sp-qr-hint">scan with your wallet app</div>
                      <div className="sp-qr-wallets">phantom &middot; backpack &middot; solflare</div>
                    </div>
                  )}

                  {signMethod === "connect" && (
                    <>
                      {!isConnected ? (
                        <div className="sp-wallet-section"><appkit-button /></div>
                      ) : walletMismatch ? (
                        <div className="sp-mismatch">
                          <div className="sp-mismatch-title">wrong wallet connected</div>
                          <div className="sp-mismatch-addrs">
                            connected: <strong>{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</strong><br />
                            expected: <strong>{session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}</strong>
                          </div>
                          <appkit-button />
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
            </>
          )}

          {state === "success" && (
            <div className="sp-center">
              <div className="sp-success-check">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#14F195" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 14l6 6L22 8" />
                </svg>
              </div>
              <div className="sp-title" style={{ color: "#14F195" }}>transaction sent</div>
              {signature && <div className="sp-sig">{signature.slice(0, 16)}...{signature.slice(-16)}</div>}
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="sp-btn-outline">view on solscan</a>
              )}
              <a href="tg://resolve?domain=razeaii_bot" className="sp-btn-ghost">back to telegram</a>
            </div>
          )}
        </div>

        <p className="sp-footer">raze.fun &middot; @raze_aii</p>
      </div>

      <style>{`
        @keyframes signPulse { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes spFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important}}
        .sp{min-height:100vh;background:linear-gradient(180deg,#FAFAFE 0%,#F0EDFF 60%,#E4DCFF 100%);display:flex;align-items:center;justify-content:center;padding:16px;font-family:var(--font-space-grotesk),sans-serif}
        .sp-container{width:100%;max-width:400px;display:flex;flex-direction:column;gap:14px;align-items:center;animation:spFadeIn .4s ease both}
        .sp-header{display:flex;align-items:center;gap:8px}
        .sp-wordmark{font-size:20px;font-weight:700;color:#1A1A1A;letter-spacing:-.03em}
        .sp-card{width:100%;background:#fff;border-radius:20px;border:1px solid #E4DCFF;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 24px rgba(153,69,255,.06)}
        .sp-top{display:flex;justify-content:space-between;align-items:flex-start}
        .sp-type{font-size:24px;font-weight:700;color:#1A1A1A;letter-spacing:-.02em}
        .sp-network{display:inline-block;margin-top:4px;font-size:10px;font-weight:600;color:#9945FF;background:rgba(153,69,255,.08);border:1px solid rgba(153,69,255,.15);border-radius:4px;padding:2px 8px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--font-jetbrains-mono),monospace}
        .sp-amounts{display:flex;align-items:center;background:#FAFAFE;border-radius:14px;padding:20px 16px;border:1px solid #F0EDFF}
        .sp-token{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1}
        .sp-token-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.08em;font-family:var(--font-jetbrains-mono),monospace}
        .sp-token-amount{font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-.02em}
        .sp-token-green{color:#14F195}
        .sp-token-symbol{font-size:13px;font-weight:600;color:#9945FF}
        .sp-arrow-wrap{width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid #E4DCFF;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sp-row{display:flex;justify-content:space-between;font-size:11px;color:#999;padding:0 4px;font-family:var(--font-jetbrains-mono),monospace}
        .sp-tx-wallet{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#999;padding:0 4px;font-family:var(--font-jetbrains-mono),monospace}
        .sp-tx-wallet-addr{color:#1A1A1A;font-weight:500}
        .sp-divider{height:1px;background:#F0EDFF;margin:2px 0}
        .sp-tabs{display:flex;gap:4px;background:#F0EDFF;border-radius:10px;padding:3px}
        .sp-tab{flex:1;padding:8px 12px;border-radius:8px;border:none;background:transparent;color:#999;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
        .sp-tab-active{background:#fff;color:#1A1A1A;box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .sp-qr-section{display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0}
        .sp-qr-box{background:#fff;border-radius:16px;padding:16px;border:1px solid #F0EDFF;box-shadow:0 2px 8px rgba(153,69,255,.06)}
        .sp-qr-hint{font-size:13px;color:#1A1A1A;font-weight:500}
        .sp-qr-wallets{font-size:11px;color:#BBB;font-family:var(--font-jetbrains-mono),monospace}
        .sp-wallet-section{display:flex;flex-direction:column;gap:10px;align-items:center}
        .sp-connected{width:100%;display:flex;justify-content:space-between;align-items:center}
        .sp-connected-left{display:flex;align-items:center;gap:6px;font-size:12px;color:#1A1A1A;font-weight:500;font-family:var(--font-jetbrains-mono),monospace}
        .sp-dot{width:6px;height:6px;border-radius:50%;background:#14F195;box-shadow:0 0 6px rgba(20,241,149,.4)}
        .sp-mismatch{width:100%;background:rgba(204,0,0,.04);border:1px solid rgba(204,0,0,.12);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;align-items:center}
        .sp-mismatch-title{font-size:13px;font-weight:700;color:#CC0000}
        .sp-mismatch-addrs{font-size:11px;color:#999;line-height:1.8;text-align:center;font-family:var(--font-jetbrains-mono),monospace}
        .sp-mismatch-addrs strong{color:#1A1A1A;font-weight:600}
        .sp-btn-primary{width:100%;padding:14px 16px;border-radius:9999px;border:none;background:#9945FF;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:-.01em;transition:transform .15s,box-shadow .15s}
        .sp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(153,69,255,.25)}
        .sp-btn-primary:active{transform:translateY(0)}
        .sp-btn-outline{display:block;width:100%;padding:12px 20px;border-radius:9999px;border:1px solid #E4DCFF;background:#fff;color:#9945FF;font-size:13px;font-weight:600;text-decoration:none;text-align:center;font-family:inherit;cursor:pointer;transition:border-color .15s}
        .sp-btn-outline:hover{border-color:#9945FF}
        .sp-btn-ghost{display:block;width:100%;padding:10px 20px;border:none;background:transparent;color:#999;font-size:13px;text-decoration:none;text-align:center;font-family:inherit;cursor:pointer}
        .sp-btn-ghost:hover{color:#666}
        .sp-center{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px 0}
        .sp-title{font-size:18px;font-weight:700;color:#1A1A1A}
        .sp-sub{font-size:13px;color:#999;margin:0}
        .sp-error-msg{font-size:12px;color:#999;text-align:center;line-height:1.5;max-width:300px;word-break:break-word;font-family:var(--font-jetbrains-mono),monospace}
        .sp-success-check{width:56px;height:56px;border-radius:50%;background:rgba(20,241,149,.1);display:flex;align-items:center;justify-content:center}
        .sp-sig{font-size:11px;color:#999;word-break:break-all;text-align:center;font-family:var(--font-jetbrains-mono),monospace}
        .sp-footer{font-size:12px;color:#BBB;margin:0;font-family:var(--font-jetbrains-mono),monospace}
      `}</style>
    </div>
  );
}
