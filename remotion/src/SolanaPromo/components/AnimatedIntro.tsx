import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS } from "../colors";

export const AnimatedIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo parts animation - like Pleo's scattered logo assembly
  const part1Progress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const part2Progress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Logo assembly - parts come together
  const part1X = interpolate(part1Progress, [0, 1], [-100, 0]);
  const part1Y = interpolate(part1Progress, [0, 1], [-50, 0]);
  const part1Rotate = interpolate(part1Progress, [0, 1], [-45, 0]);
  const part1Opacity = interpolate(part1Progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  const part2X = interpolate(part2Progress, [0, 1], [100, 0]);
  const part2Y = interpolate(part2Progress, [0, 1], [50, 0]);
  const part2Rotate = interpolate(part2Progress, [0, 1], [45, 0]);
  const part2Opacity = interpolate(part2Progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Brand name animation
  const nameProgress = spring({
    frame: frame - 35,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const nameOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nameY = interpolate(nameProgress, [0, 1], [30, 0]);

  // Tagline animation
  const taglineOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(
    spring({ frame: frame - 55, fps, config: { damping: 15, stiffness: 100 } }),
    [0, 1],
    [20, 0]
  );

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
          background: `radial-gradient(ellipse at 50% 40%, ${COLORS.primary}08 0%, transparent 50%)`,
        }}
      />

      {/* Animated Logo - Two halves of infinity symbol */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 120,
          marginBottom: 40,
        }}
      >
        {/* Left loop of infinity */}
        <svg
          viewBox="0 0 60 80"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 100,
            height: 120,
            transform: `translate(${part1X}px, ${part1Y}px) rotate(${part1Rotate}deg)`,
            opacity: part1Opacity,
          }}
        >
          <path
            d="M50 40 C50 25, 30 25, 10 40 C-10 55, 10 55, 30 40"
            fill="none"
            stroke={COLORS.primary}
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>

        {/* Right loop of infinity */}
        <svg
          viewBox="0 0 60 80"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 100,
            height: 120,
            transform: `translate(${part2X}px, ${part2Y}px) rotate(${part2Rotate}deg)`,
            opacity: part2Opacity,
          }}
        >
          <path
            d="M10 40 C10 55, 30 55, 50 40 C70 25, 50 25, 30 40"
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
          opacity: nameOpacity,
          transform: `translateY(${Math.max(0, nameY)}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 90,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: -3,
          }}
        >
          Raze
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          opacity: taglineOpacity,
          transform: `translateY(${Math.max(0, taglineY)}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 32,
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
