"use client";

import { useEffect, useCallback } from "react";
import { createQR, encodeURL } from "@solana/pay";

export default function TestSignPage() {
  const qrRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.innerHTML = "";
    try {
      const apiUrl = `${window.location.origin}/api/sign/test`;
      const solanaUrl = encodeURL({ link: new URL(apiUrl), label: "Raze Test", message: "Test transaction" });
      console.log("[TestQR] URL:", solanaUrl.toString());
      const qr = createQR(solanaUrl, 250, "white");
      qr.append(node);
    } catch (e) {
      console.error("[TestQR]", e);
      node.textContent = "QR failed: " + String(e);
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      fontFamily: "var(--font-space-grotesk), sans-serif",
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>Solana Pay QR Test</h1>
      <p style={{ fontSize: 13, color: "#999" }}>Scan with Phantom to send 0.000001 SOL to yourself</p>
      <div ref={qrRef} style={{
        background: "#fff", borderRadius: 16, padding: 16,
        border: "1px solid #E4DCFF",
      }} />
      <p style={{ fontSize: 11, color: "#BBB", fontFamily: "monospace" }}>
        endpoint: /api/sign/test
      </p>
    </div>
  );
}
