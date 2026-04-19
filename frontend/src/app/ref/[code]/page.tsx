import { Metadata } from "next";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: "Raze — Join the Waitlist",
    description: "Everything Solana in one chat. Your friend invited you to skip the line.",
    openGraph: {
      title: "Raze — You've been invited",
      description: "An AI agent that trades, researches, and roasts you. Join the beta waitlist.",
      url: `https://raze.fun/ref/${code}`,
    },
  };
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;
  const telegramLink = `https://t.me/razeaii_bot?start=ref_${code}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050008",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Space Grotesk', 'Inter', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Logo + mascot */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <img
            src="/assets/imp-expressions/waving.png"
            alt="Raze"
            style={{ width: 100, height: 100, objectFit: "contain" }}
          />
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-2px",
              margin: 0,
            }}
          >
            raze
          </h1>
          <p style={{ fontSize: 18, color: "#888888", margin: 0, textAlign: "center" }}>
            Everything Solana in one chat
          </p>
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
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 16, color: "#C0C0D0", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            Your friend invited you to <strong style={{ color: "#FFFFFF" }}>skip the line</strong>.
          </p>

          <a
            href={telegramLink}
            style={{
              display: "block",
              width: "100%",
              padding: "16px 24px",
              borderRadius: 12,
              background: "#9945FF",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 700,
              textDecoration: "none",
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            Join Waitlist via Telegram →
          </a>

          <p style={{ fontSize: 13, color: "#6B6180", textAlign: "center", margin: 0 }}>
            free • takes 2 seconds • no app download
          </p>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <p style={{ fontSize: 12, color: "#3A3550", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
            What Raze does
          </p>
          {[
            { icon: "💱", text: "Swap tokens via Jupiter — one message" },
            { icon: "🔍", text: "AI-powered token research + security scans" },
            { icon: "👀", text: "Real-time whale tracking + smart alerts" },
            { icon: "💀", text: "Savage crypto friend personality" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "#12101A",
                borderRadius: 10,
                border: "1px solid #1A1A2A",
              }}
            >
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: "#A0A0B0" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ fontSize: 12, color: "#3A3550", textAlign: "center" }}>
          raze.fun — @razeaii_bot
        </div>
      </div>
    </div>
  );
}
