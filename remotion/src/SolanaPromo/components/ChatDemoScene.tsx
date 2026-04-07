import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";
import { IPhoneMockup } from "./IPhoneMockup";

// Chat conversation - Whale tracking + copy trade flow
const CHAT_MESSAGES = [
  {
    type: "bot" as const,
    text: "🐋 ansem.sol just aped $47K into $AI16Z\n\nwallet is up 847% this month 👀",
  },
  {
    type: "user" as const,
    text: "show his bag",
  },
  {
    type: "bot" as const,
    text: "52K tokens @ $0.89\ncurrent: $0.91 (+2%)\n\nstill early ser",
  },
  {
    type: "user" as const,
    text: "ape 5 sol",
  },
  {
    type: "bot" as const,
    text: "✅ done.\n\n+5,420 AI16Z @ $0.91\ntracking alongside ansem 🎯",
  },
];

// Rhythmic timing - messages appear in sync with a beat (every ~30 frames = 1 second)
const MESSAGE_APPEAR_FRAMES = [20, 50, 80, 130, 160];

export const ChatDemoScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone entrance - faster
  const phoneScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  const phoneY = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 120 } }),
    [0, 1],
    [80, 0]
  );

  const phoneOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle phone tilt for depth
  const phoneRotation = interpolate(frame, [0, 30], [3, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Calculate visible messages based on frame
  let visibleMessages = 0;
  for (let i = 0; i < MESSAGE_APPEAR_FRAMES.length; i++) {
    if (frame >= MESSAGE_APPEAR_FRAMES[i]) {
      visibleMessages = i + 1;
    }
  }

  // Side text - faster entrance
  const sideTextOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Feature labels that appear with the chat - synced with messages
  const features = [
    { text: "Whale Tracking", icon: "🐋", showAt: 20, color: COLORS.primary },
    { text: "Copy Trading", icon: "🎯", showAt: 130, color: COLORS.green },
    { text: "Instant Execution", icon: "⚡", showAt: 160, color: COLORS.yellow },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Background gradients (no blur for performance) */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}15 0%, transparent 70%)`,
          left: "5%",
          top: "10%",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.green}10 0%, transparent 70%)`,
          right: "10%",
          bottom: "20%",
        }}
      />

      {/* Left side - Text content */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: sideTextOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 14,
          }}
        >
          Trade Smarter
        </div>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 60,
            fontWeight: 700,
            color: COLORS.white,
            lineHeight: 1.05,
            maxWidth: 480,
          }}
        >
          Follow the
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.yellow} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            smart money
          </span>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 45,
          }}
        >
          {features.map((feature) => {
            const featureProgress = spring({
              frame: frame - feature.showAt,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            const featureOpacity = interpolate(
              frame,
              [feature.showAt, feature.showAt + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={feature.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 22px",
                  background: `${feature.color}10`,
                  borderRadius: 14,
                  border: `1px solid ${feature.color}30`,
                  opacity: Math.max(0, featureOpacity),
                  transform: `scale(${Math.max(0, featureProgress)}) translateX(${interpolate(Math.max(0, featureProgress), [0, 1], [-25, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 26 }}>{feature.icon}</span>
                <span
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: 19,
                    fontWeight: 600,
                    color: feature.color,
                  }}
                >
                  {feature.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side - iPhone mockup */}
      <div
        style={{
          position: "absolute",
          right: 120,
          opacity: phoneOpacity,
          transform: `scale(${phoneScale}) translateY(${phoneY}px)`,
        }}
      >
        <IPhoneMockup
          messages={CHAT_MESSAGES}
          visibleMessages={visibleMessages}
          scale={1.05}
          rotation={phoneRotation}
        />
      </div>
    </AbsoluteFill>
  );
};
