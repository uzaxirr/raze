import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";

export const CleanCTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main text animation
  const textScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // URL animation
  const urlOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlY = interpolate(
    spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 120 } }),
    [0, 1],
    [15, 0]
  );

  // Button animation
  const buttonScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const buttonOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow for button
  const glowPulse = frame > 70 ? 0.6 + Math.sin((frame - 70) * 0.1) * 0.2 : 0;

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
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.primary}15 0%, transparent 50%)`,
        }}
      />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}25 0%, transparent 60%)`,
          filter: "blur(100px)",
          opacity: 0.5 + Math.sin(frame * 0.04) * 0.2,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Main CTA text */}
        <div
          style={{
            transform: `scale(${Math.max(0, textScale)})`,
            opacity: textOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 64,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: -2,
            }}
          >
            Start trading
          </div>
          <div
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 64,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.yellow} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: -2,
            }}
          >
            smarter
          </div>
        </div>

        {/* Website URL */}
        <div
          style={{
            marginTop: 20,
            opacity: Math.max(0, urlOpacity),
            transform: `translateY(${Math.max(0, urlY)}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 32,
              fontWeight: 500,
              color: COLORS.primary,
            }}
          >
            raze.sh
          </div>
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 30,
            transform: `scale(${Math.max(0, buttonScale)})`,
            opacity: Math.max(0, buttonOpacity),
            position: "relative",
          }}
        >
          {/* Button glow */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              background: COLORS.primary,
              borderRadius: 40,
              filter: "blur(25px)",
              opacity: glowPulse * 0.5,
            }}
          />

          {/* Button */}
          <div
            style={{
              position: "relative",
              padding: "18px 45px",
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, #FF8A50 100%)`,
              borderRadius: 16,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.white,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: `0 8px 30px ${COLORS.primary}40`,
            }}
          >
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 18,
          fontWeight: 400,
          color: COLORS.textLight,
          opacity: interpolate(frame, [70, 90], [0, 0.7], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Your AI-powered Solana assistant on Telegram
      </div>
    </AbsoluteFill>
  );
};
