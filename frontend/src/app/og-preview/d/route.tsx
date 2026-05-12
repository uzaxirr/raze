import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const fontData = readFileSync(
  join(process.cwd(), "src/app/fonts/VanillaDreamers.otf")
);

const impDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/assets/imp-expressions/waving.png")
).toString("base64")}`;

// Option D: Split — Product + Brand
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: Phone mockup on gradient */}
        <div
          style={{
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #0188e8 0%, #5fe69a 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "220px",
              borderRadius: "30px",
              overflow: "hidden",
              background: "#000",
              padding: "6px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "24px",
                overflow: "hidden",
                background: "#C8D9E6",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#517DA2", padding: "22px 10px 8px" }}>
                <img src={impDataUrl} alt="" width={20} height={20} style={{ borderRadius: "50%", objectFit: "contain", background: "#F0EDFF" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "#fff", fontSize: "11px", fontWeight: 600 }}>Raze</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "8px" }}>online</span>
                </div>
              </div>
              {/* Messages */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "8px 6px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#EEFFDE", padding: "5px 8px", borderRadius: "8px 3px 8px 8px", fontSize: "10px", color: "#1A1A1A" }}>
                    is BONK safe?
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#fff", padding: "5px 8px", borderRadius: "3px 8px 8px 8px", fontSize: "10px", color: "#1A1A1A", maxWidth: "180px" }}>
                    bonk looks clean. massive holders, high liquidity, no bundles
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "#EEFFDE", padding: "5px 8px", borderRadius: "8px 3px 8px 8px", fontSize: "10px", color: "#1A1A1A" }}>
                    swap 5 SOL to USDC
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#fff", padding: "5px 8px", borderRadius: "3px 8px 8px 8px", fontSize: "10px", color: "#1A1A1A", maxWidth: "180px" }}>
                    done. 674.50 USDC via Jupiter, 0.4s
                  </div>
                </div>
              </div>
              {/* Input */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#EFEFE4", padding: "6px 8px" }}>
                <div style={{ flex: 1, background: "#fff", borderRadius: "16px", padding: "4px 8px" }}>
                  <span style={{ fontSize: "9px", color: "#999" }}>Message</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Brand */}
        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            background: "#fbf9ef",
            padding: "48px",
            gap: "20px",
          }}
        >
          <img src={impDataUrl} alt="" width={80} height={80} style={{ objectFit: "contain" }} />
          <div
            style={{
              fontSize: "56px",
              fontFamily: "Vanilla",
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
          <div
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#1A1A1A",
              lineHeight: 1.3,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Manage your crypto</span>
            <span>from text</span>
          </div>
          <div style={{ fontSize: "16px", color: "#888", display: "flex" }}>
            Trade, research, protect — all in one Telegram chat
          </div>
          <div
            style={{
              background: "#0983db",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "100px",
              display: "flex",
              marginTop: "4px",
            }}
          >
            Start Chatting
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Vanilla", data: fontData, style: "normal" }],
    }
  );
}
