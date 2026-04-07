import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../colors";

type Message = {
  type: "user" | "bot";
  text: string;
};

type Props = {
  messages: Message[];
  visibleMessages: number;
  glowColor?: string;
};

// iPhone frame colors
const FRAME_COLOR = "#1C1C2E";
const FRAME_EDGE = "#2D2D42";
const BEZEL_COLOR = "#000000";

export const MiniPhone = ({ messages, visibleMessages, glowColor = COLORS.primary }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "relative" }}>
      {/* Subtle glow */}
      <div
        style={{
          position: "absolute",
          inset: -30,
          background: `radial-gradient(ellipse at center, ${glowColor}25 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          position: "relative",
          width: 270,
          background: FRAME_COLOR,
          borderRadius: 46,
          padding: 3,
          boxShadow: `
            0 25px 50px -12px rgba(0,0,0,0.5),
            inset 0 0 0 1px ${FRAME_EDGE}
          `,
        }}
      >
        {/* Side button - Right (power) */}
        <div
          style={{
            position: "absolute",
            right: -3,
            top: 110,
            width: 3,
            height: 50,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "0 2px 2px 0",
          }}
        />

        {/* Side buttons - Left */}
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 80,
            width: 3,
            height: 22,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 112,
            width: 3,
            height: 40,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "2px 0 0 2px",
          }}
        />

        {/* Inner bezel (black edge) */}
        <div
          style={{
            background: BEZEL_COLOR,
            borderRadius: 43,
            padding: 2,
          }}
        >
          {/* Screen */}
          <div
            style={{
              background: COLORS.tgChat,
              borderRadius: 41,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 75,
                height: 24,
                background: BEZEL_COLOR,
                borderRadius: 14,
                zIndex: 10,
              }}
            />

            {/* Status bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 18px 8px",
                color: COLORS.tgText,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "-apple-system, sans-serif",
              }}
            >
              <span>9:41</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                  {[3, 5, 7, 9].map((h, i) => (
                    <div key={i} style={{ width: 2, height: h, background: COLORS.tgText, borderRadius: 1 }} />
                  ))}
                </div>
                <div style={{ width: 16, height: 8, border: `1px solid ${COLORS.tgText}`, borderRadius: 2, padding: 1 }}>
                  <div style={{ width: "70%", height: "100%", background: COLORS.tgText, borderRadius: 1 }} />
                </div>
              </div>
            </div>

            {/* Chat header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}cc 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg viewBox="0 0 120 80" style={{ width: "65%", height: "65%" }}>
                  <path
                    d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
                    fill="none"
                    stroke="#FFF"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div style={{ color: COLORS.tgText, fontSize: 14, fontWeight: 600 }}>Raze</div>
                <div style={{ color: COLORS.tgBlue, fontSize: 11 }}>bot</div>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                height: 245,
                padding: "12px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {messages.slice(0, visibleMessages).map((msg, i) => {
                const messageDelay = i * 6;
                const popProgress = spring({
                  frame: frame - messageDelay,
                  fps,
                  config: { damping: 12, stiffness: 200, mass: 0.5 },
                });

                const messageScale = interpolate(popProgress, [0, 1], [0.3, 1]);
                const messageOpacity = interpolate(popProgress, [0, 0.5], [0, 1], {
                  extrapolateRight: "clamp",
                });
                const messageY = interpolate(popProgress, [0, 1], [15, 0]);

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                      transform: `scale(${messageScale}) translateY(${messageY}px)`,
                      opacity: messageOpacity,
                      transformOrigin: msg.type === "user" ? "right center" : "left center",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "8px 12px",
                        borderRadius: 14,
                        borderBottomRightRadius: msg.type === "user" ? 4 : 14,
                        borderBottomLeftRadius: msg.type === "bot" ? 4 : 14,
                        background: msg.type === "user" ? COLORS.tgUser : COLORS.tgBot,
                        color: COLORS.tgText,
                        fontSize: 12,
                        lineHeight: 1.4,
                        whiteSpace: "pre-line",
                        fontFamily: "-apple-system, sans-serif",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderTop: `1px solid rgba(255,255,255,0.06)`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: COLORS.tgBg,
                  borderRadius: 18,
                  padding: "8px 14px",
                  color: COLORS.tgMuted,
                  fontSize: 12,
                }}
              >
                Message
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: COLORS.tgBlue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFF">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
            </div>

            {/* Home indicator */}
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 6px" }}>
              <div style={{ width: 90, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
