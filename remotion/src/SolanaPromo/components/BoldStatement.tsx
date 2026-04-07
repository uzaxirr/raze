import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../colors";

type Props = {
  line1: string;
  line2?: string;
  highlight?: "line1" | "line2" | "none";
};

export const BoldStatement = ({ line1, line2, highlight = "none" }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1 animation
  const line1Progress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const line1Opacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line1Y = interpolate(line1Progress, [0, 1], [40, 0]);

  // Line 2 animation (if present)
  const line2Progress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const line2Opacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Y = interpolate(line2Progress, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle background */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 50%, ${COLORS.primary}06 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${Math.max(0, line1Y)}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 80,
              fontWeight: 600,
              color: highlight === "line1" ? COLORS.primary : COLORS.white,
              textAlign: "center",
              letterSpacing: -2,
            }}
          >
            {line1}
          </div>
        </div>

        {/* Line 2 */}
        {line2 && (
          <div
            style={{
              opacity: line2Opacity,
              transform: `translateY(${Math.max(0, line2Y)}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 80,
                fontWeight: 600,
                color: highlight === "line2" ? COLORS.primary : COLORS.white,
                textAlign: "center",
                letterSpacing: -2,
              }}
            >
              {line2}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
