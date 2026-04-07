import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";

export const CleanIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Logo opacity
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tagline animation
  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 100 } }),
    [0, 1],
    [20, 0]
  );

  // Subtle glow pulse
  const glowOpacity = 0.4 + Math.sin(frame * 0.05) * 0.15;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle background gradient */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.primary}12 0%, transparent 50%)`,
        }}
      />

      {/* Logo glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}30 0%, transparent 60%)`,
          filter: "blur(80px)",
          opacity: glowOpacity,
        }}
      />

      {/* Logo + Text container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        {/* Raze Logo */}
        <div
          style={{
            width: 120,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 120 80" style={{ width: "100%", height: "100%" }}>
            <path
              d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 72,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: -2,
          }}
        >
          Raze
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          opacity: taglineOpacity,
          transform: `translateY(${Math.max(0, taglineY)}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.textLight,
          }}
        >
          Built for people who live on-chain
        </div>
      </div>
    </AbsoluteFill>
  );
};
