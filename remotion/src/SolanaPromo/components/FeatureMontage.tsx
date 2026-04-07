import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";
import { MiniPhone } from "./MiniPhone";

// Different feature demos with their chat snippets (reduced to 4 for better pacing)
const FEATURE_DEMOS = [
  {
    title: "Security Check",
    icon: "🛡️",
    color: COLORS.green,
    messages: [
      { type: "user" as const, text: "is $PUMP safe?" },
      { type: "bot" as const, text: "✅ mint revoked\n✅ LP burned\n⚠️ top 10 hold 23%\n\nScore: 7/8" },
    ],
  },
  {
    title: "Token Intel",
    icon: "📊",
    color: COLORS.primary,
    messages: [
      { type: "user" as const, text: "what was $TRUMP ATH" },
      { type: "bot" as const, text: "ATH: $46.12\ncurrent: $5.45\ndown 88% 💀\n\nclassic celebrity pump" },
    ],
  },
  {
    title: "Quick Swap",
    icon: "💱",
    color: COLORS.yellow,
    messages: [
      { type: "user" as const, text: "swap 2 SOL to BONK" },
      { type: "bot" as const, text: "✅ Done!\n\n+4.8M BONK\nvia Jupiter\n0.02% slippage" },
    ],
  },
  {
    title: "Price Alerts",
    icon: "🔔",
    color: "#8B5CF6",
    messages: [
      { type: "user" as const, text: "alert me when SOL hits $200" },
      { type: "bot" as const, text: "⏰ Alert set!\n\nSOL >= $200\nI'll ping you 🎯" },
    ],
  },
];

// Feature card timing - each card ~3.5 seconds with overlap
// 4 cards * 100 frames - 3 overlaps * 20 = 340 frames (~11.3s visible content)
const CARD_DURATION = 100;
const CARD_OVERLAP = 20;

export const FeatureMontage = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header animation
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const headerY = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 140 } }),
    [0, 1],
    [-30, 0]
  );

  // Calculate which cards are visible and their states
  const getCardState = (index: number) => {
    const startFrame = index * (CARD_DURATION - CARD_OVERLAP);
    const relativeFrame = frame - startFrame;

    // Entry animation (0-20 frames)
    const entryProgress = interpolate(relativeFrame, [0, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.2)),
    });

    // Exit animation
    const exitStart = CARD_DURATION - 15;
    const exitProgress = interpolate(relativeFrame, [exitStart, CARD_DURATION], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });

    // 3D flip rotation
    const flipIn = interpolate(entryProgress, [0, 1], [-90, 0]);
    const flipOut = interpolate(exitProgress, [0, 1], [0, 90]);
    const rotateY = relativeFrame < exitStart ? flipIn : flipOut;

    // Scale with bounce
    const scaleIn = interpolate(entryProgress, [0, 1], [0.5, 1]);
    const scaleOut = interpolate(exitProgress, [0, 1], [1, 0.8]);
    const scale = relativeFrame < exitStart ? scaleIn : scaleOut;

    // Opacity
    const opacityIn = interpolate(entryProgress, [0, 0.3], [0, 1], {
      extrapolateRight: "clamp",
    });
    const opacityOut = interpolate(exitProgress, [0.5, 1], [1, 0], {
      extrapolateLeft: "clamp",
    });
    const opacity = relativeFrame < exitStart ? opacityIn : opacityOut;

    // Position offset for stacking effect
    const xOffset = interpolate(index % 2, [0, 1], [-1, 1]) * 50 * (1 - entryProgress);
    const yOffset = interpolate(entryProgress, [0, 1], [30, 0]) - interpolate(exitProgress, [0, 1], [0, -30]);

    // Calculate visible messages with rhythmic timing (pop on beat)
    // First message appears after entry animation, second shortly after
    const MESSAGE_DELAYS = [30, 55]; // Adjusted for longer card duration
    let visibleMessages = 0;
    for (let i = 0; i < MESSAGE_DELAYS.length; i++) {
      if (relativeFrame >= MESSAGE_DELAYS[i]) {
        visibleMessages = i + 1;
      }
    }

    return {
      isVisible: relativeFrame > -10 && relativeFrame < CARD_DURATION + 10,
      rotateY,
      scale,
      opacity,
      xOffset,
      yOffset,
      visibleMessages,
      relativeFrame,
    };
  };

  // Background particles (reduced for performance)
  const particles = Array.from({ length: 10 }, (_, i) => ({
    x: (i * 180) % 1920,
    y: (i * 100) % 1080,
    size: 3 + (i % 3) * 2,
    color: FEATURE_DEMOS[i % FEATURE_DEMOS.length].color,
  }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        overflow: "hidden",
      }}
    >
      {/* Static background particles (no per-frame animation for performance) */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            opacity: 0.2,
          }}
        />
      ))}

      {/* Background gradient blobs (static, no blur for performance) */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}15 0%, transparent 70%)`,
          left: "5%",
          top: "15%",
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
          bottom: "5%",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
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
            marginBottom: 10,
          }}
        >
          Powerful Features
        </div>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.white,
          }}
        >
          Everything in one chat
        </div>
      </div>

      {/* Feature cards container - 3D perspective */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -45%)",
          perspective: 1200,
          perspectiveOrigin: "center center",
        }}
      >
        {FEATURE_DEMOS.map((demo, index) => {
          const state = getCardState(index);
          if (!state.isVisible) return null;

          return (
            <div
              key={demo.title}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `
                  translate(-50%, -50%)
                  translateX(${state.xOffset}px)
                  translateY(${state.yOffset}px)
                  rotateY(${state.rotateY}deg)
                  scale(${state.scale})
                `,
                opacity: state.opacity,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Feature label */}
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  background: `${demo.color}20`,
                  borderRadius: 30,
                  border: `1px solid ${demo.color}40`,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 22 }}>{demo.icon}</span>
                <span
                  style={{
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: demo.color,
                  }}
                >
                  {demo.title}
                </span>
              </div>

              {/* Mini phone */}
              <MiniPhone
                messages={demo.messages}
                visibleMessages={state.visibleMessages}
                glowColor={demo.color}
              />
            </div>
          );
        })}
      </div>

      {/* Progress indicators */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
        }}
      >
        {FEATURE_DEMOS.map((demo, index) => {
          const startFrame = index * (CARD_DURATION - CARD_OVERLAP);
          const isActive = frame >= startFrame && frame < startFrame + CARD_DURATION;
          const progress = interpolate(
            frame - startFrame,
            [0, CARD_DURATION],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={index}
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: isActive ? "transparent" : "rgba(255,255,255,0.2)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${progress * 100}%`,
                    background: demo.color,
                    borderRadius: 2,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
