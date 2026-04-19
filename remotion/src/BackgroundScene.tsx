import {interpolate} from 'remotion';
import {colors} from './tokens';

/**
 * Background scene — full-canvas dark gradient with 6 drifting orbs,
 * vignette, and two corner shimmers. Per spec.
 */
export const BackgroundScene: React.FC<{frame: number; ctaDark: number}> = ({
  frame,
}) => {
  const orbs = [
    {cx: 15, cy: 20, r: 28, speedX: 0.0008, speedY: 0.0006, phaseX: 0.0, phaseY: 1.2},
    {cx: 75, cy: 15, r: 32, speedX: 0.0007, speedY: 0.0009, phaseX: 2.1, phaseY: 0.4},
    {cx: 50, cy: 55, r: 36, speedX: 0.0005, speedY: 0.0007, phaseX: 1.0, phaseY: 3.0},
    {cx: 85, cy: 70, r: 30, speedX: 0.0009, speedY: 0.0005, phaseX: 3.5, phaseY: 1.8},
    {cx: 20, cy: 75, r: 34, speedX: 0.0006, speedY: 0.0008, phaseX: 0.7, phaseY: 2.5},
    {cx: 60, cy: 88, r: 26, speedX: 0.001, speedY: 0.0006, phaseX: 4.2, phaseY: 0.9},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(145deg, ${colors.bgDarkA} 0%, ${colors.bgDarkB} 40%, ${colors.bgDarkC} 100%)`,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{position: 'absolute', inset: 0}}
      >
        <defs>
          <radialGradient id="orb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.purple} stopOpacity="0.18" />
            <stop offset="100%" stopColor={colors.purple} stopOpacity="0" />
          </radialGradient>
        </defs>
        {orbs.map((o, i) => {
          const dx = Math.sin(frame * o.speedX * Math.PI * 2 + o.phaseX) * 4;
          const dy = Math.sin(frame * o.speedY * Math.PI * 2 + o.phaseY) * 4;
          return (
            <ellipse
              key={i}
              cx={o.cx + dx}
              cy={o.cy + dy}
              rx={o.r}
              ry={o.r}
              fill="url(#orb)"
            />
          );
        })}
      </svg>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 50% 50%, transparent 40%, ${colors.bgVignette} 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Corner shimmers */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle at 0% 100%, rgba(153,69,255,0.06) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '40%',
          background: `radial-gradient(circle at 100% 0%, rgba(153,69,255,0.05) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
