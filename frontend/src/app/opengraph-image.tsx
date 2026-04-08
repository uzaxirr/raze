import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Raze — Your crypto friend who never sleeps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #F0EDFF 0%, #E4DCFF 100%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: "24px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#9945FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "white",
                  marginRight: "4px",
                }}
              />
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "white",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              raze.fun
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
            }}
          >
            Your crypto friend who never sleeps
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "22px",
              color: "#666666",
              lineHeight: 1.4,
            }}
          >
            Trade, research, and explore Solana through natural conversation.
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              background: "#9945FF",
              borderRadius: "100px",
              padding: "14px 32px",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
              Start Chatting
            </span>
          </div>
        </div>

        {/* Right: Ghost mascot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "380px",
          }}
        >
          <svg
            width="300"
            height="330"
            viewBox="0 0 200 220"
            fill="none"
          >
            <path
              d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C53 156, 58 161, 64 166 C70 171, 75 166, 80 161 C86 156, 91 161, 97 166 C103 171, 108 166, 113 161 C119 156, 124 161, 130 166 C136 171, 141 166, 146 161 C152 156, 158 161, 165 166 C172 161, 168 155, 168 150 L168 98 C168 58, 140 25, 100 25Z"
              fill="#9945FF"
            />
            <ellipse cx="74" cy="88" rx="18" ry="20" fill="#FFFFFF" />
            <ellipse cx="74" cy="88" rx="12" ry="14" fill="#2D1B69" />
            <ellipse cx="74" cy="88" rx="7" ry="8" fill="#1A1040" />
            <ellipse cx="72" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
            <ellipse cx="126" cy="88" rx="12" ry="14" fill="#2D1B69" />
            <ellipse cx="126" cy="88" rx="7" ry="8" fill="#1A1040" />
            <ellipse cx="124" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="100" cy="115" rx="12" ry="8" fill="#7B2FE0" />
            <ellipse cx="60" cy="104" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
            <ellipse cx="140" cy="104" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
            <path
              d="M32 95 C20 85, 10 65, 5 50"
              stroke="#9945FF"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="3" cy="46" r="7" fill="#9945FF" />
            <path
              d="M168 100 C180 92, 188 78, 190 65"
              stroke="#9945FF"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="191" cy="62" r="6" fill="#9945FF" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
