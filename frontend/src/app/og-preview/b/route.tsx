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

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
      <span style={{ color: "#888", fontSize: "11px" }}>{label}</span>
      <span style={{ color: color ?? "#1A1A1A", fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

// Option B: Phone + Conversation on gradient
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0188e8 0%, #5fe69a 50%, #a25af0 100%)",
          fontFamily: "sans-serif",
          gap: "60px",
          padding: "40px 60px",
        }}
      >
        {/* Left: Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src={impDataUrl} alt="" width={64} height={64} style={{ objectFit: "contain" }} />
            <div style={{ fontSize: "48px", fontFamily: "Vanilla", color: "#fff", letterSpacing: "-0.03em", display: "flex" }}>
              raze.fun
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#fff", lineHeight: 1.3, display: "flex", flexDirection: "column" }}>
            <span>Manage your crypto</span>
            <span>from text</span>
          </div>
          <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", display: "flex" }}>
            Trade, research, and explore Solana — all in one chat
          </div>
        </div>

        {/* Right: Phone mockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "280px",
            borderRadius: "36px",
            overflow: "hidden",
            background: "#000",
            padding: "8px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "28px",
              overflow: "hidden",
              background: "#C8D9E6",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#517DA2", padding: "28px 14px 10px" }}>
              <img src={impDataUrl} alt="" width={24} height={24} style={{ borderRadius: "50%", objectFit: "contain", background: "#F0EDFF" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>Raze</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "9px" }}>online</span>
              </div>
            </div>
            {/* Chat */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "10px 8px" }}>
              {/* User */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "#EEFFDE", padding: "6px 10px", borderRadius: "9px 3px 9px 9px", fontSize: "12px", color: "#1A1A1A" }}>
                  is BONK safe?
                </div>
              </div>
              {/* Bot */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#fff", padding: "8px 10px", borderRadius: "3px 9px 9px 9px", maxWidth: "220px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "9px", color: "#9945FF", fontFamily: "monospace" }}>checked security, holders...</span>
                  <span style={{ fontSize: "11px", color: "#1A1A1A" }}>bonk looks clean. massive holder base, high liquidity, no bundles</span>
                  <div style={{ background: "#F5F5F5", borderRadius: "4px", padding: "4px 6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <Row label="price" value="$0.00003" />
                    <Row label="mcap" value="$2.1B" />
                    <Row label="holders" value="847K" />
                    <Row label="momentum" value="6/8" color="#14A86C" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "#EAFFF5", borderRadius: "3px", padding: "2px 6px" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "2px", background: "#14F195" }} />
                    <span style={{ fontSize: "8px", color: "#14A86C", fontFamily: "monospace" }}>low risk · legit</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#EFEFE4", padding: "8px 10px" }}>
              <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "6px 12px" }}>
                <span style={{ fontSize: "10px", color: "#999" }}>Message</span>
              </div>
              <div style={{ width: "22px", height: "22px", borderRadius: "11px", background: "#517DA2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>{">"}</span>
              </div>
            </div>
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
