export default function UnleashedSuccess() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09080f",
        color: "#e7e9ea",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(153,69,255,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          maxWidth: 480,
          padding: "40px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 24 }}>🔥</div>

        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            fontFamily: "var(--font-display, var(--font-sans))",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          you&apos;re <span style={{ color: "#9945FF" }}>unleashed</span>.
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
            marginBottom: 40,
          }}
        >
          unlimited messages, auto-sign wallet, whale alerts, KOL feed intel, and iMessage access are now live. go make some money.
        </p>

        <a
          href="https://t.me/razeaii_bot"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "#9945FF",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Open Raze on Telegram
        </a>
      </div>
    </div>
  );
}
