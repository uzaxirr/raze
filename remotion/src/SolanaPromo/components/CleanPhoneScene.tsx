import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";

// Chat conversations to cycle through
const CONVERSATIONS = [
  {
    title: "Whale Alert",
    messages: [
      { type: "bot" as const, text: "🐋 ansem.sol just aped $47K into $AI16Z\n\nwallet is up 847% this month" },
      { type: "user" as const, text: "show his bag" },
      { type: "bot" as const, text: "52K tokens @ $0.89\ncurrent: $0.91 (+2%)\n\nstill early ser" },
    ],
  },
  {
    title: "Quick Swap",
    messages: [
      { type: "user" as const, text: "swap 2 SOL to BONK" },
      { type: "bot" as const, text: "✅ Done!\n\n+4.8M BONK\nvia Jupiter\n0.02% slippage" },
    ],
  },
  {
    title: "Security Check",
    messages: [
      { type: "user" as const, text: "is $PUMP safe?" },
      { type: "bot" as const, text: "✅ mint revoked\n✅ LP burned\n⚠️ top 10 hold 23%\n\nScore: 7/10" },
    ],
  },
  {
    title: "Price Alert",
    messages: [
      { type: "user" as const, text: "alert me when SOL hits $200" },
      { type: "bot" as const, text: "⏰ Alert set!\n\nSOL >= $200\nI'll ping you 🎯" },
    ],
  },
];

const CONVERSATION_DURATION = 150; // 5 seconds per conversation

export const CleanPhoneScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance animation
  const phoneScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 100 } }),
    [0, 1],
    [60, 0]
  );

  // Determine which conversation to show
  const conversationIndex = Math.min(
    Math.floor(frame / CONVERSATION_DURATION),
    CONVERSATIONS.length - 1
  );
  const conversationFrame = frame % CONVERSATION_DURATION;
  const conversation = CONVERSATIONS[conversationIndex];

  // Message animation within conversation
  const getMessageOpacity = (msgIndex: number) => {
    const delay = msgIndex * 35;
    return interpolate(conversationFrame, [delay, delay + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const getMessageY = (msgIndex: number) => {
    const delay = msgIndex * 35;
    const progress = spring({
      frame: conversationFrame - delay,
      fps,
      config: { damping: 14, stiffness: 120 },
    });
    return interpolate(progress, [0, 1], [20, 0]);
  };

  // Subtle background glow animation
  const glowPulse = 0.3 + Math.sin(frame * 0.03) * 0.1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 30%, ${COLORS.primary}15 0%, transparent 50%)`,
        }}
      />

      {/* Secondary subtle glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}20 0%, transparent 60%)`,
          filter: "blur(100px)",
          opacity: glowPulse,
        }}
      />

      {/* Centered iPhone */}
      <div
        style={{
          transform: `scale(${phoneScale}) translateY(${phoneY}px)`,
        }}
      >
        {/* Phone outer frame - iPhone 15 Pro style */}
        <div
          style={{
            position: "relative",
            width: 380,
            background: "linear-gradient(145deg, #4a4a4e 0%, #2a2a2c 50%, #3a3a3e 100%)",
            borderRadius: 55,
            padding: 4,
            boxShadow: `
              0 50px 100px -20px rgba(0,0,0,0.8),
              0 30px 60px -30px rgba(0,0,0,0.6),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Inner bezel */}
          <div
            style={{
              background: "#000",
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
                  top: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 120,
                  height: 36,
                  background: "#000",
                  borderRadius: 18,
                  zIndex: 10,
                }}
              />

              {/* Status bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 28px 10px",
                  color: COLORS.tgText,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "-apple-system, SF Pro Text, sans-serif",
                }}
              >
                <span>9:41</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <svg width="18" height="12" viewBox="0 0 18 12" fill={COLORS.tgText}>
                    <rect x="0" y="5" width="3" height="7" rx="1" opacity="0.4" />
                    <rect x="5" y="3" width="3" height="9" rx="1" opacity="0.6" />
                    <rect x="10" y="1" width="3" height="11" rx="1" opacity="0.8" />
                    <rect x="15" y="0" width="3" height="12" rx="1" />
                  </svg>
                  <svg width="25" height="12" viewBox="0 0 25 12" fill={COLORS.tgText}>
                    <rect x="0" y="1" width="22" height="10" rx="2" stroke={COLORS.tgText} strokeWidth="1" fill="none" />
                    <rect x="2" y="3" width="16" height="6" rx="1" fill={COLORS.tgText} />
                    <rect x="23" y="4" width="2" height="4" rx="1" fill={COLORS.tgText} opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Chat header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 12px ${COLORS.primary}40`,
                  }}
                >
                  <svg viewBox="0 0 120 80" style={{ width: "65%", height: "65%" }}>
                    <path
                      d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
                      fill="none"
                      stroke="#FFF"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <div style={{ color: COLORS.tgText, fontSize: 17, fontWeight: 600, fontFamily: "-apple-system, sans-serif" }}>
                    Raze
                  </div>
                  <div style={{ color: COLORS.tgBlue, fontSize: 13, fontFamily: "-apple-system, sans-serif" }}>
                    bot
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div
                style={{
                  height: 380,
                  padding: "16px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflowY: "hidden",
                }}
              >
                {conversation.messages.map((msg, i) => (
                  <div
                    key={`${conversationIndex}-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                      opacity: getMessageOpacity(i),
                      transform: `translateY(${getMessageY(i)}px)`,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: 18,
                        borderBottomRightRadius: msg.type === "user" ? 4 : 18,
                        borderBottomLeftRadius: msg.type === "bot" ? 4 : 18,
                        background: msg.type === "user" ? COLORS.tgUser : COLORS.tgBot,
                        color: COLORS.tgText,
                        fontSize: 15,
                        lineHeight: 1.4,
                        whiteSpace: "pre-line",
                        fontFamily: "-apple-system, SF Pro Text, sans-serif",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: COLORS.tgBg,
                    borderRadius: 20,
                    padding: "10px 16px",
                    color: COLORS.tgMuted,
                    fontSize: 15,
                    fontFamily: "-apple-system, sans-serif",
                  }}
                >
                  Message
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: COLORS.tgBlue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFF">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>

              {/* Home indicator */}
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 10px" }}>
                <div
                  style={{
                    width: 134,
                    height: 5,
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title text below phone */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 24,
            fontWeight: 500,
            color: COLORS.textLight,
            opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {conversation.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
