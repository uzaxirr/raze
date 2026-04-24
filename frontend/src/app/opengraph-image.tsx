import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const alt = "Raze — Everything Solana inside one chat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const impDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/assets/imp-expressions/waving.png")
).toString("base64")}`;

function ChatBubble({ user, bot }: { user: string; bot: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            background: "#9945FF",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: "16px 16px 4px 16px",
          }}
        >
          {user}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <img
          src={impDataUrl}
          alt=""
          width={26}
          height={26}
          style={{ objectFit: "contain", borderRadius: "50%", marginTop: "2px" }}
        />
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            color: "#1A1A1A",
            fontSize: "13px",
            padding: "8px 14px",
            borderRadius: "4px 16px 16px 16px",
            maxWidth: "340px",
            lineHeight: 1.4,
            border: "1px solid rgba(153,69,255,0.1)",
          }}
        >
          {bot}
        </div>
      </div>
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #F0EDFF 0%, #E8E0FF 50%, #F0EDFF 100%)",
          padding: "40px 56px",
          fontFamily: "sans-serif",
          alignItems: "center",
        }}
      >
        {/* Left: Mascot + Wordmark + Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "380px",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          {/* Mascot */}
          <img
            src={impDataUrl}
            alt=""
            width={120}
            height={120}
            style={{ objectFit: "contain" }}
          />

          {/* Wordmark */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#1A1A1A",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              display: "flex",
            }}
          >
            <span>raze</span>
            <span style={{ color: "#9945FF" }}>.</span>
            <span>fun</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "20px",
              color: "#777",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>everything solana</span>
            <span>in one chat.</span>
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#9945FF",
              fontWeight: 600,
              display: "flex",
            }}
          >
            @razeaii_bot on Telegram
          </div>
        </div>

        {/* Right: Chat conversation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "10px",
            justifyContent: "center",
            paddingLeft: "24px",
          }}
        >
          <ChatBubble
            user="scan my wallet"
            bot="full scan: $3.3k in stables. 4 dust attacks. 0.03 SOL — one failed tx from broke."
          />
          <ChatBubble
            user="check toly.sol"
            bot="toly has 42k SOL. you have 0.03. inspirational."
          />
          <ChatBubble
            user="swap 10 USDG to SOL"
            bot="done. 10 USDG to 0.11 SOL. sign button coming up."
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
