import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Raze — Your crypto friend who never sleeps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Fetch the mascot PNG at request/build time. Using `new URL` relative to
  // this module lets Next.js resolve the public asset on both edge & node.
  const impResponse = await fetch(
    new URL("../../public/assets/imp-expressions/waving.png", import.meta.url)
  );
  const impBuffer = await impResponse.arrayBuffer();
  const impDataUrl = `data:image/png;base64,${Buffer.from(impBuffer).toString("base64")}`;

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={impDataUrl}
              alt=""
              width={44}
              height={44}
              style={{ objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "26px",
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
              fontSize: "60px",
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.12,
              letterSpacing: "-0.04em",
            }}
          >
            Your crypto friend who never sleeps
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "22px",
              color: "#5A5466",
              lineHeight: 1.4,
              maxWidth: "620px",
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
              padding: "16px 34px",
              alignSelf: "flex-start",
              marginTop: "4px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
              Start Chatting
            </span>
          </div>
        </div>

        {/* Right: Imp mascot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "420px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={impDataUrl}
            alt="Raze imp"
            width={360}
            height={360}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
