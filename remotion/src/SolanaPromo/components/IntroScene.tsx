import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";

// Raze Logo SVG - Animated (simplified for performance)
const RazeLogo = ({ scale = 1, glowIntensity = 0 }: { scale?: number; glowIntensity?: number }) => (
  <div style={{ position: "relative", transform: `scale(${scale})` }}>
    {/* Main logo */}
    <svg viewBox="0 0 120 80" style={{ width: 200, height: 133, position: "relative" }}>
      {/* Glow layer (thicker, lower opacity instead of blur) */}
      <path
        d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="16"
        strokeLinecap="round"
        opacity={glowIntensity * 0.3}
      />
      <path
        d="M20 40 C20 20, 40 20, 60 40 C80 60, 100 60, 100 40 C100 20, 80 20, 60 40 C40 60, 20 60, 20 40"
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // FASTER animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const logoRotation = interpolate(
    spring({ frame, fps, config: { damping: 20, stiffness: 150 } }),
    [0, 1],
    [-10, 0]
  );

  const logoOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const glowIntensity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) + Math.sin(frame * 0.15) * 0.2;

  // Title - faster entrance
  const titleProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 18, stiffness: 140 },
  });

  const titleY = interpolate(Math.max(0, titleProgress), [0, 1], [50, 0]);
  const titleOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline - faster
  const taglineOpacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(
    spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 150 } }),
    [0, 1],
    [25, 0]
  );

  // Background pulse
  const bgPulse = Math.sin(frame * 0.08) * 0.05 + 0.15;

  // Particle burst effect
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const burstProgress = interpolate(frame, [5, 35], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const distance = burstProgress * 300 + 50;
    return {
      x: Math.cos(angle) * distance + 960,
      y: Math.sin(angle) * distance + 540,
      size: 4 + (i % 3) * 2,
      opacity: interpolate(burstProgress, [0, 0.3, 1], [0, 0.6, 0]),
    };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Radial gradient background (no blur for performance) */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}20 0%, transparent 70%)`,
          opacity: bgPulse + 0.2,
        }}
      />

      {/* Particle burst */}
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
            backgroundColor: COLORS.primary,
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
          opacity: logoOpacity,
          marginBottom: 24,
        }}
      >
        <RazeLogo glowIntensity={glowIntensity} />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 108,
          fontWeight: 700,
          color: COLORS.white,
          letterSpacing: -4,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Raze
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 32,
          fontWeight: 500,
          color: COLORS.textLight,
          opacity: Math.max(0, taglineOpacity),
          transform: `translateY(${Math.max(0, taglineY)}px)`,
          marginTop: 12,
        }}
      >
        Built for people who live on-chain
      </div>
    </AbsoluteFill>
  );
};
