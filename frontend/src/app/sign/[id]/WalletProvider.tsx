"use client";

import { type ReactNode, useEffect, useState } from "react";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

let initialized = false;

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];
    const addLog = (msg: string) => {
      console.log("[WalletProvider]", msg);
      logs.push(msg);
      setLog([...logs]);
    };

    async function init() {
      if (initialized) {
        addLog("Already initialized");
        setReady(true);
        return;
      }

      if (!projectId) {
        setError("Missing NEXT_PUBLIC_REOWN_PROJECT_ID");
        setReady(true);
        return;
      }

      try {
        addLog("Importing @reown/appkit/react...");
        const appkit = await import("@reown/appkit/react");
        addLog("OK. Importing @reown/appkit-adapter-solana/react...");
        const adapter = await import("@reown/appkit-adapter-solana/react");
        addLog("OK. Importing @reown/appkit/networks...");
        const networks = await import("@reown/appkit/networks");
        addLog("OK. All imports done. Creating AppKit...");

        appkit.createAppKit({
          adapters: [new adapter.SolanaAdapter()],
          networks: [networks.solana],
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
        addLog("AppKit created successfully");
        setReady(true);
      } catch (e: unknown) {
        const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
        addLog(`FAILED: ${msg}`);
        setError(msg);
        setReady(true);
      }
    }

    init();
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0D0B14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
        color: "#6B6180",
        fontSize: 12,
        fontFamily: "monospace",
      }}>
        <div style={{ fontSize: 14, color: "#F0ECF9" }}>loading wallet...</div>
        {log.map((l, i) => (
          <div key={i} style={{ color: l.includes("FAIL") ? "#FF6B6B" : "#4A4560" }}>{l}</div>
        ))}
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
          fontSize: 11,
          color: "#6B6180",
          textAlign: "center",
          maxWidth: 340,
          lineHeight: 1.6,
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}>
          {error}
        </div>
        <div style={{ fontSize: 11, color: "#4A4560", marginTop: 4, fontFamily: "monospace" }}>
          projectId: {projectId ? `${projectId.slice(0, 8)}...` : "NOT SET"}
        </div>
        {log.map((l, i) => (
          <div key={i} style={{ fontSize: 10, color: "#4A4560", fontFamily: "monospace" }}>{l}</div>
        ))}
        <button
          onClick={() => window.location.reload()}
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
