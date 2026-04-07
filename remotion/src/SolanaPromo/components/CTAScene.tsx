import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";

// Raze Logo with animation (simplified for performance)
const RazeLogo = ({ scale = 1, glow = 0 }: { scale?: number; glow?: number }) => (
  <div style={{ position: "relative", transform: `scale(${scale})` }}>
    <svg viewBox="0 0 120 80" style={{ width: 100, height: 67, position: "relative" }}>
      {/* Glow layer */}
      <path
        d="M20 40 C20 25, 40 25, 60 40 C80 55, 100 55, 100 40 C100 25, 80 25, 60 40 C40 55, 20 55, 20 40"
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="14"
        strokeLinecap="round"
        opacity={glow * 0.4}
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

export const CTAScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoGlow = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  }) + Math.sin(frame * 0.15) * 0.2;

  // Main text animation
  const textScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL animation
  const urlOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlY = interpolate(
    spring({ frame: frame - 35, fps, config: { damping: 18, stiffness: 140 } }),
    [0, 1],
    [20, 0]
  );

  // Button animation with bounce
  const buttonScale = spring({
    frame: frame - 55,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const buttonOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow
  const glowIntensity = frame > 80
    ? 0.5 + Math.sin((frame - 80) * 0.15) * 0.25
    : interpolate(frame, [70, 80], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Background animation
  const bgRotation = frame * 0.1;

  // Particles (reduced for performance)
  const particles = Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const radius = 420;
    return {
      x: Math.cos(angle) * radius + 960,
      y: Math.sin(angle) * radius + 540,
      size: 3 + (i % 3) * 2,
      opacity: 0.25,
    };
  });

  // Radial lines
  const lines = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360 + bgRotation,
    length: interpolate(frame, [0, 60], [0, 600], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Radial lines background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.08,
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: line.length,
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${COLORS.primary} 100%)`,
              transformOrigin: "left center",
              transform: `rotate(${line.angle}deg)`,
            }}
          />
        ))}
      </div>

      {/* Animated particles */}
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

      {/* Central glow (no blur for performance) */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}20 0%, transparent 70%)`,
          opacity: glowIntensity + 0.2,
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: 100,
          transform: `scale(${logoScale})`,
        }}
      >
        <RazeLogo glow={logoGlow} />
      </div>

      {/* Main CTA text */}
      <div
        style={{
          transform: `scale(${Math.max(0, textScale)})`,
          opacity: textOpacity,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 80,
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
            fontSize: 80,
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
          marginTop: 30,
          opacity: Math.max(0, urlOpacity),
          transform: `translateY(${Math.max(0, urlY)}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 36,
            fontWeight: 500,
            color: COLORS.white,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: COLORS.textLight }}>Visit</span>
          <span
            style={{
              color: COLORS.primary,
              fontWeight: 600,
            }}
          >
            raze.sh
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          marginTop: 45,
          transform: `scale(${Math.max(0, buttonScale)})`,
          opacity: Math.max(0, buttonOpacity),
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Button glow (simplified) */}
        <div
          style={{
            position: "absolute",
            inset: -15,
            background: `radial-gradient(ellipse at center, ${COLORS.primary}40 0%, transparent 70%)`,
            borderRadius: 50,
            opacity: glowIntensity * 0.8,
          }}
        />

        {/* Button */}
        <div
          style={{
            position: "relative",
            padding: "22px 55px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, #FF8A50 100%)`,
            borderRadius: 18,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 26,
            fontWeight: 600,
            color: COLORS.white,
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: `0 10px 40px ${COLORS.primary}50`,
          }}
        >
          <span>Get Started</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Footer tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 50,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 18,
          fontWeight: 400,
          color: COLORS.textLight,
          opacity: interpolate(frame, [80, 100], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Built for people who live on-chain
      </div>
    </AbsoluteFill>
  );
};
