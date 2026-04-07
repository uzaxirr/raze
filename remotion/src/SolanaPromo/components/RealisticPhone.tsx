import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
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

export const RealisticPhone = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance animation
  const phoneProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  const phoneScale = interpolate(phoneProgress, [0, 1], [0.9, 1]);
  const phoneY = interpolate(phoneProgress, [0, 1], [80, 0]);
  const phoneOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Determine which conversation to show
  const conversationIndex = Math.min(
    Math.floor(frame / CONVERSATION_DURATION),
    CONVERSATIONS.length - 1
  );
  const conversationFrame = frame % CONVERSATION_DURATION;
  const conversation = CONVERSATIONS[conversationIndex];

  // Message animation within conversation
  const getMessageOpacity = (msgIndex: number) => {
    const delay = msgIndex * 30;
    return interpolate(conversationFrame, [delay, delay + 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const getMessageY = (msgIndex: number) => {
    const delay = msgIndex * 30;
    const progress = spring({
      frame: conversationFrame - delay,
      fps,
      config: { damping: 14, stiffness: 120 },
    });
    return interpolate(progress, [0, 1], [15, 0]);
  };

  // Subtle reflection animation
  const reflectionOffset = Math.sin(frame * 0.02) * 5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow behind phone */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 800,
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.primary}20 0%, transparent 60%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Phone container with 3D perspective */}
      <div
        style={{
          transform: `scale(${phoneScale}) translateY(${phoneY}px)`,
          opacity: phoneOpacity,
          perspective: 1000,
        }}
      >
        {/* iPhone 15 Pro - Titanium Frame */}
        <div
          style={{
            position: "relative",
            width: 390,
            borderRadius: 58,
            // Titanium frame gradient
            background: `linear-gradient(
              145deg,
              #67676B 0%,
              #4A4A4E 15%,
              #3A3A3E 30%,
              #2D2D31 50%,
              #3A3A3E 70%,
              #4A4A4E 85%,
              #5A5A5E 100%
            )`,
            padding: 3,
            // Realistic shadow
            boxShadow: `
              0 60px 100px -20px rgba(0,0,0,0.7),
              0 30px 60px -20px rgba(0,0,0,0.5),
              0 10px 20px -5px rgba(0,0,0,0.4),
              inset 0 1px 1px rgba(255,255,255,0.15),
              inset 0 -1px 1px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Side buttons - Volume */}
          <div
            style={{
              position: "absolute",
              left: -3,
              top: 140,
              width: 3,
              height: 35,
              background: "linear-gradient(90deg, #2D2D31 0%, #4A4A4E 100%)",
              borderRadius: "2px 0 0 2px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -3,
              top: 190,
              width: 3,
              height: 60,
              background: "linear-gradient(90deg, #2D2D31 0%, #4A4A4E 100%)",
              borderRadius: "2px 0 0 2px",
            }}
          />

          {/* Side button - Power */}
          <div
            style={{
              position: "absolute",
              right: -3,
              top: 180,
              width: 3,
              height: 80,
              background: "linear-gradient(90deg, #4A4A4E 0%, #2D2D31 100%)",
              borderRadius: "0 2px 2px 0",
            }}
          />

          {/* Inner black bezel */}
          <div
            style={{
              background: "#000000",
              borderRadius: 55,
              padding: 3,
            }}
          >
            {/* Screen container */}
            <div
              style={{
                position: "relative",
                background: COLORS.tgChat,
                borderRadius: 52,
                overflow: "hidden",
              }}
            >
              {/* Glass reflection overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(
                    ${135 + reflectionOffset}deg,
                    rgba(255,255,255,0.08) 0%,
                    transparent 30%,
                    transparent 70%,
                    rgba(255,255,255,0.03) 100%
                  )`,
                  pointerEvents: "none",
                  zIndex: 100,
                  borderRadius: 52,
                }}
              />

              {/* Dynamic Island */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 126,
                  height: 38,
                  background: "#000",
                  borderRadius: 19,
                  zIndex: 50,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                {/* Camera lens */}
                <div
                  style={{
                    position: "absolute",
                    right: 18,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%)",
                    border: "1px solid #2a2a3e",
                  }}
                />
              </div>

              {/* Status bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 32px 12px",
                  color: COLORS.tgText,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif",
                }}
              >
                <span style={{ width: 54 }}>9:41</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {/* Signal bars */}
                  <svg width="18" height="12" viewBox="0 0 18 12">
                    <rect x="0" y="6" width="3" height="6" rx="1" fill={COLORS.tgText} opacity="0.4" />
                    <rect x="5" y="4" width="3" height="8" rx="1" fill={COLORS.tgText} opacity="0.6" />
                    <rect x="10" y="2" width="3" height="10" rx="1" fill={COLORS.tgText} opacity="0.8" />
                    <rect x="15" y="0" width="3" height="12" rx="1" fill={COLORS.tgText} />
                  </svg>
                  {/* WiFi */}
                  <svg width="16" height="12" viewBox="0 0 16 12" fill={COLORS.tgText}>
                    <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-3.5-2.5a5 5 0 017 0l-1.2 1.2a3.2 3.2 0 00-4.6 0L4.5 7zm-2.5-2.5a8 8 0 0112 0l-1.2 1.2a6.2 6.2 0 00-9.6 0L2 4.5z" />
                  </svg>
                  {/* Battery */}
                  <svg width="27" height="13" viewBox="0 0 27 13">
                    <rect x="0.5" y="0.5" width="23" height="12" rx="3" stroke={COLORS.tgText} strokeWidth="1" fill="none" />
                    <rect x="2.5" y="2.5" width="18" height="8" rx="1.5" fill={COLORS.tgText} />
                    <rect x="24.5" y="4" width="2" height="5" rx="1" fill={COLORS.tgText} opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Chat header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 18px 14px",
                  background: "rgba(0,0,0,0.2)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Back arrow */}
                <svg width="12" height="20" viewBox="0 0 12 20" fill={COLORS.tgBlue}>
                  <path d="M10 2L2 10l8 8" stroke={COLORS.tgBlue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>

                {/* Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, #FF8A50 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 15px ${COLORS.primary}50`,
                  }}
                >
                  <svg viewBox="0 0 120 80" style={{ width: "60%", height: "60%" }}>
                    <path
                      d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
                      fill="none"
                      stroke="#FFF"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Name and status */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: COLORS.tgText,
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: "SF Pro Text, -apple-system, sans-serif",
                  }}>
                    Raze
                  </div>
                  <div style={{
                    color: COLORS.tgBlue,
                    fontSize: 14,
                    fontFamily: "SF Pro Text, -apple-system, sans-serif",
                    marginTop: 1,
                  }}>
                    online
                  </div>
                </div>

                {/* More button */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill={COLORS.tgBlue}>
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </div>

              {/* Messages area */}
              <div
                style={{
                  height: 380,
                  padding: "20px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
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
                        maxWidth: "82%",
                        padding: "11px 16px",
                        borderRadius: 20,
                        borderBottomRightRadius: msg.type === "user" ? 6 : 20,
                        borderBottomLeftRadius: msg.type === "bot" ? 6 : 20,
                        background: msg.type === "user"
                          ? `linear-gradient(135deg, ${COLORS.tgUser} 0%, #3a6a9e 100%)`
                          : COLORS.tgBot,
                        color: COLORS.tgText,
                        fontSize: 16,
                        lineHeight: 1.45,
                        whiteSpace: "pre-line",
                        fontFamily: "SF Pro Text, -apple-system, sans-serif",
                        boxShadow: msg.type === "user"
                          ? "0 2px 8px rgba(43, 82, 120, 0.3)"
                          : "0 2px 8px rgba(0,0,0,0.2)",
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
                  gap: 12,
                  padding: "10px 14px 12px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(0,0,0,0.15)",
                }}
              >
                {/* Attachment button */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill={COLORS.tgMuted}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke={COLORS.tgMuted} strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>

                {/* Text input */}
                <div
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 22,
                    padding: "12px 18px",
                    color: COLORS.tgMuted,
                    fontSize: 16,
                    fontFamily: "SF Pro Text, -apple-system, sans-serif",
                  }}
                >
                  Message
                </div>

                {/* Mic button */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill={COLORS.tgMuted}>
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke={COLORS.tgMuted} strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              {/* Home indicator */}
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 10px" }}>
                <div
                  style={{
                    width: 140,
                    height: 5,
                    background: "rgba(255,255,255,0.35)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature title below phone */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "SF Pro Display, system-ui, -apple-system, sans-serif",
            fontSize: 26,
            fontWeight: 500,
            color: COLORS.textLight,
            opacity: interpolate(frame, [25, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            letterSpacing: -0.5,
          }}
        >
          {conversation.title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
