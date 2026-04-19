import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const alt = "Raze — You were invited";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const impDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/assets/imp-expressions/waving.png")
).toString("base64")}`;

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
              fontSize: "56px",
              fontWeight: 700,
              color: "#1A1A1A",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            you were
            <br />
            invited.
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "20px",
              color: "#777",
              lineHeight: 1.5,
              maxWidth: "400px",
            }}
          >
            your friend thinks you need a crypto co-pilot.
            <br />
            they might be right.
          </div>

          {/* CTA button */}
          <div
            style={{
              display: "flex",
              background: "#9945FF",
              borderRadius: "100px",
              padding: "18px 40px",
              alignSelf: "flex-start",
              marginTop: "4px",
            }}
          >
            <span
              style={{ fontSize: "18px", fontWeight: 700, color: "white" }}
            >
              Join Waitlist &rarr;
            </span>
          </div>
        </div>

        {/* Right: Phone mockup with static chat */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "480px",
          }}
        >
          <div
            style={{
              width: "260px",
              height: "500px",
              background: "#1A1A1A",
              borderRadius: "36px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            }}
          >
            {/* Screen */}
            <div
              style={{
                flex: 1,
                borderRadius: "28px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                background: "#f3f0ff",
              }}
            >
              {/* Status bar + header */}
              <div
                style={{
                  background: "#4A7FB8",
                  padding: "12px 16px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#9945FF",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={impDataUrl}
                    alt=""
                    width={48}
                    height={48}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    Raze
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "10px",
                    }}
                  >
                    bot · online
                  </span>
                </div>
              </div>

              {/* Chat messages */}
              <div
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Exchange 1 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      background: "#D6F0B8",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "7px 11px",
                      fontSize: "11px",
                      color: "#1A1A1A",
                    }}
                  >
                    is $WIF safe?
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#9945FF",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={impDataUrl}
                      alt=""
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "4px 14px 14px 14px",
                      padding: "7px 11px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#9945FF",
                        fontWeight: 600,
                      }}
                    >
                      raze
                    </span>
                    <span style={{ fontSize: "11px", color: "#1A1A1A" }}>
                      score: 8/8 ✅ no mint auth.
                    </span>
                    <span style={{ fontSize: "11px", color: "#1A1A1A" }}>
                      lp burned. clean 😏
                    </span>
                  </div>
                </div>

                {/* Exchange 2 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      background: "#D6F0B8",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "7px 11px",
                      fontSize: "11px",
                      color: "#1A1A1A",
                    }}
                  >
                    swap 5 SOL to USDC
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#9945FF",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={impDataUrl}
                      alt=""
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "4px 14px 14px 14px",
                      padding: "7px 11px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#9945FF",
                        fontWeight: 600,
                      }}
                    >
                      raze
                    </span>
                    <span style={{ fontSize: "11px", color: "#1A1A1A" }}>
                      done. 847.50 USDC 💀
                    </span>
                  </div>
                </div>

                {/* Exchange 3 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      background: "#D6F0B8",
                      borderRadius: "14px 14px 4px 14px",
                      padding: "7px 11px",
                      fontSize: "11px",
                      color: "#1A1A1A",
                    }}
                  >
                    watch toly.sol
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#9945FF",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={impDataUrl}
                      alt=""
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "4px 14px 14px 14px",
                      padding: "7px 11px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#9945FF",
                        fontWeight: 600,
                      }}
                    >
                      raze
                    </span>
                    <span style={{ fontSize: "11px", color: "#1A1A1A" }}>
                      watching 👀
                    </span>
                  </div>
                </div>
              </div>

              {/* Composer */}
              <div
                style={{
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "white",
                  borderTop: "1px solid #eee",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "28px",
                    borderRadius: "14px",
                    border: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    fontSize: "10px",
                    color: "#aaa",
                  }}
                >
                  Message...
                </div>
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "#9945FF",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
