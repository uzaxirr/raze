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

// Option C: Minimal Brand Card
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf9ef",
          fontFamily: "sans-serif",
          gap: "24px",
        }}
      >
        <img
          src={impDataUrl}
          alt=""
          width={120}
          height={120}
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            fontSize: "80px",
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
            color: "#666",
            display: "flex",
          }}
        >
          Your on-chain intelligence, one message away
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              background: "#0983db",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: "100px",
              display: "flex",
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
