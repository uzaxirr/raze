"use client";

import { useState } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Auto-Sign Wallet",
    desc: "Raze executes trades for you instantly. No sign buttons, no wallet popups.",
  },
  {
    icon: "🐦",
    title: "KOL Feed Intel",
    desc: "Connect your X account. Raze reads your feed, auto-scans every token your KOLs mention, pings you only about the safe ones.",
  },
  {
    icon: "🐋",
    title: "Whale Alerts",
    desc: "Real-time notifications when tracked wallets move. Know before everyone else.",
  },
  {
    icon: "☀️",
    title: "Daily Briefing",
    desc: "Your overnight KOL alpha in 30 seconds. No doomscrolling required.",
  },
  {
    icon: "💬",
    title: "iMessage Access",
    desc: "Text Raze from iMessage like a friend. Blue bubbles, typing indicators, the works.",
  },
  {
    icon: "∞",
    title: "Unlimited Messages",
    desc: "No daily caps. Ask as much as you want, whenever you want.",
  },
];

export default function UnleashedPage() {
  const [loading, setLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.raze.fun";
      const resp = await fetch(`${backendUrl}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09080f",
        color: "#e7e9ea",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(153,69,255,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "80px 24px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(153,69,255,0.15)",
              border: "1px solid rgba(153,69,255,0.3)",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#9945FF",
              marginBottom: 24,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Raze Unleashed
          </div>

          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 800,
              fontFamily: "var(--font-display, var(--font-sans))",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 20px",
            }}
          >
            stop waiting.
            <br />
            <span style={{ color: "#9945FF" }}>get unleashed.</span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            your KOLs post 50 tokens a week. 47 are rugs.
            <br />
            raze reads your feed and only sends you the 3 that are safe.
          </p>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 60,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "24px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(153,69,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
              }
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#fff",
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing card */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(153,69,255,0.1) 0%, rgba(153,69,255,0.05) 100%)",
            border: "1px solid rgba(153,69,255,0.25)",
            borderRadius: 20,
            padding: "40px 32px",
            textAlign: "center",
            maxWidth: 440,
            margin: "0 auto 40px",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              fontFamily: "var(--font-display, var(--font-sans))",
              letterSpacing: "-0.03em",
              marginBottom: 4,
            }}
          >
            $5<span style={{ fontSize: 20, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/month</span>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 32,
            }}
          >
            cancel anytime. one winning trade pays for 10 months.
          </div>

          {/* Pay with Card */}
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "#9945FF",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              marginBottom: 12,
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Redirecting..." : "Pay with Card"}
          </button>

          {/* Pay with Crypto */}
          <a
            href="https://t.me/razeaii_bot?start=unleashed"
            style={{
              display: "block",
              width: "100%",
              padding: "14px 0",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Pay with Crypto (5 USDC)
          </a>

          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 16,
            }}
          >
            crypto payments are processed on Solana via USDC
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center" }}>
          <a
            href="https://t.me/razeaii_bot"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            or try the free version on Telegram →
          </a>
        </div>
      </div>
    </div>
  );
}
