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

// Option A: Hero Style — sky gradient + headline
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          fontFamily: "sans-serif",
          background: "linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #98D4A0 70%, #4CAF50 100%)",
        }}
      >
        {/* Dark overlay for text contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)",
            display: "flex",
          }}
        />

        {/* Imp mascot in corner */}
        <img
          src={impDataUrl}
          alt=""
          width={140}
          height={140}
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            objectFit: "contain",
            opacity: 0.95,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "88px",
              fontFamily: "Vanilla",
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 1.0,
              textShadow: "0 4px 24px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Manage your crypto</span>
            <span>from text</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#FFFFFF",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                display: "flex",
              }}
            >
              raze.fun
            </div>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.7)",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: "20px",
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                display: "flex",
              }}
            >
              everything Solana in one chat
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
