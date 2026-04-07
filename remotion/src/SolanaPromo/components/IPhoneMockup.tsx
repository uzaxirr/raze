import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";

type Message = {
  type: "user" | "bot";
  text: string;
};

type Props = {
  messages: Message[];
  visibleMessages: number;
  showTypingIndicator?: boolean;
  scale?: number;
  rotation?: number;
  glowColor?: string;
};

// Raze Logo SVG
const RazeLogo = () => (
  <svg viewBox="0 0 120 80" style={{ width: "100%", height: "100%" }}>
    <path
      d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="8"
      strokeLinecap="round"
    />
  </svg>
);

// iPhone frame colors
const FRAME_COLOR = "#1C1C2E";
const FRAME_EDGE = "#2D2D42";
const BEZEL_COLOR = "#000000";

export const IPhoneMockup = ({
  messages,
  visibleMessages,
  showTypingIndicator = false,
  scale = 1,
  rotation = 0,
  glowColor = COLORS.primary,
}: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const displayedMessages = messages.slice(0, visibleMessages);

  // Typing indicator animation (only compute if needed)
  const dotOpacity1 = showTypingIndicator ? interpolate((frame % 20), [0, 7, 14, 20], [0.3, 1, 0.3, 0.3]) : 0;
  const dotOpacity2 = showTypingIndicator ? interpolate((frame % 20), [0, 7, 14, 20], [0.3, 0.3, 1, 0.3]) : 0;
  const dotOpacity3 = showTypingIndicator ? interpolate((frame % 20), [0, 7, 14, 20], [0.3, 0.3, 0.3, 1]) : 0;

  return (
    <div
      style={{
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        position: "relative",
      }}
    >
      {/* Subtle glow */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      {/* iPhone Frame */}
      <div
        style={{
          position: "relative",
          width: 340,
          background: FRAME_COLOR,
          borderRadius: 54,
          padding: 3,
          boxShadow: `
            0 30px 60px -15px rgba(0,0,0,0.5),
            inset 0 0 0 1px ${FRAME_EDGE}
          `,
        }}
      >
        {/* Side buttons - Right side (power) */}
        <div
          style={{
            position: "absolute",
            right: -3,
            top: 130,
            width: 4,
            height: 65,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "0 3px 3px 0",
          }}
        />

        {/* Side buttons - Left side (silent switch) */}
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 95,
            width: 4,
            height: 28,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "3px 0 0 3px",
          }}
        />
        {/* Volume buttons */}
        <div
          style={{
            position: "absolute",
            left: -3,
            top: 135,
            width: 4,
            height: 50,
            background: `linear-gradient(90deg, ${FRAME_COLOR} 0%, ${FRAME_EDGE} 50%, ${FRAME_COLOR} 100%)`,
            borderRadius: "3px 0 0 3px",
          }}
        />

        {/* Inner bezel (black edge) */}
        <div
          style={{
            background: BEZEL_COLOR,
            borderRadius: 51,
            padding: 3,
          }}
        >
          {/* Screen */}
          <div
            style={{
              background: COLORS.tgChat,
              borderRadius: 48,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: "50%",
                transform: "translateX(-50%)",
                width: 105,
                height: 34,
                background: BEZEL_COLOR,
                borderRadius: 20,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 20,
              }}
            >
              {/* Camera lens */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #1a1a2e 0%, #0a0a12 60%, #000 100%)",
                  border: "1px solid #222",
                }}
              />
            </div>

            {/* Status Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                padding: "18px 28px 10px",
                color: COLORS.tgText,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              }}
            >
              <span style={{ fontFeatureSettings: '"tnum"' }}>9:41</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {/* Signal bars */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
                  {[4, 6, 9, 12].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 3,
                        height: h,
                        background: COLORS.tgText,
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </div>
                {/* WiFi icon */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill={COLORS.tgText} style={{ marginLeft: 2 }}>
                  <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-2.83-2.12a4 4 0 015.66 0l-1.06 1.06a2.5 2.5 0 00-3.54 0l-1.06-1.06zm-2.12-2.12a7 7 0 019.9 0l-1.06 1.06a5.5 5.5 0 00-7.78 0L3.05 5.26z" />
                </svg>
                {/* Battery */}
                <div style={{ display: "flex", alignItems: "center", marginLeft: 3 }}>
                  <div
                    style={{
                      width: 25,
                      height: 12,
                      border: `1.5px solid ${COLORS.tgText}`,
                      borderRadius: 4,
                      padding: 2,
                    }}
                  >
                    <div
                      style={{
                        width: "80%",
                        height: "100%",
                        background: COLORS.tgText,
                        borderRadius: 1.5,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 2,
                      height: 5,
                      background: COLORS.tgText,
                      borderRadius: "0 1px 1px 0",
                      marginLeft: 1,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Chat Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
              }}
            >
              {/* Back arrow */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill={COLORS.tgBlue}>
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}cc 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 9,
                }}
              >
                <RazeLogo />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: COLORS.tgText,
                    fontSize: 17,
                    fontWeight: 600,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                  }}
                >
                  Raze
                </div>
                <div
                  style={{
                    color: COLORS.tgBlue,
                    fontSize: 13,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                  }}
                >
                  {showTypingIndicator ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      typing
                      <span style={{ display: "flex", gap: 2, marginLeft: 2 }}>
                        {[dotOpacity1, dotOpacity2, dotOpacity3].map((op, i) => (
                          <span
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              background: COLORS.tgBlue,
                              opacity: op,
                            }}
                          />
                        ))}
                      </span>
                    </span>
                  ) : (
                    "bot"
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                height: 400,
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                overflow: "hidden",
              }}
            >
              {displayedMessages.map((msg, i) => {
                const messageDelay = i * 8;
                const popProgress = spring({
                  frame: frame - messageDelay,
                  fps,
                  config: { damping: 12, stiffness: 200, mass: 0.5 },
                });

                const messageScale = interpolate(popProgress, [0, 1], [0.3, 1]);
                const messageOpacity = interpolate(popProgress, [0, 0.5], [0, 1], {
                  extrapolateRight: "clamp",
                });
                const messageY = interpolate(popProgress, [0, 1], [20, 0]);

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
                        maxWidth: "82%",
                        padding: "10px 14px",
                        borderRadius: 18,
                        borderBottomRightRadius: msg.type === "user" ? 4 : 18,
                        borderBottomLeftRadius: msg.type === "bot" ? 4 : 18,
                        background: msg.type === "user" ? COLORS.tgUser : COLORS.tgBot,
                        color: COLORS.tgText,
                        fontSize: 15,
                        lineHeight: 1.4,
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderTop: `1px solid rgba(255,255,255,0.06)`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: COLORS.tgBg,
                  borderRadius: 22,
                  padding: "11px 18px",
                  color: COLORS.tgMuted,
                  fontSize: 16,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                }}
              >
                Message
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  background: COLORS.tgBlue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
            </div>

            {/* Home Indicator */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 8px",
              }}
            >
              <div
                style={{
                  width: 134,
                  height: 5,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
