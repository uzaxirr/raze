import {interpolate} from 'remotion';
import {colors, typography} from './tokens';

/**
 * CTA End Card — dark overlay, mascot with spring bounce, "Try it now at / raze.fun".
 * Frames 580–750 per spec.
 */
export const EndCard: React.FC<{frame: number; mascotSrc: string}> = ({
  frame,
  mascotSrc,
}) => {
  const overlayOpacity = interpolate(frame, [580, 600], [0, 0.82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < 580) return null;

  // Mascot spring entrance, frames 590–615
  const mascotY = interpolate(frame, [590, 615], [120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => {
      // cubic-bezier(0.34, 1.56, 0.64, 1) approximation via overshoot
      // Use a simple overshoot; Remotion's interpolate doesn't take easing fn
      // here by default — apply as remapped t outside.
      return t;
    },
  });
  // Apply spring overshoot manually for nicer bounce
  const springT = Math.min(1, Math.max(0, (frame - 590) / 25));
  const springOvershoot =
    springT < 1
      ? 1 - Math.pow(1 - springT, 3) + Math.sin(springT * Math.PI * 1.5) * 0.15 * (1 - springT)
      : 1;
  const mascotYSpring = (1 - springOvershoot) * 120;

  const mascotOpacity = interpolate(frame, [585, 605], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gentle floating after settle
  const floatScale =
    frame > 615 ? 1 + Math.sin((frame - 615) * 0.08) * 0.025 : 1;

  const mascotShadow = interpolate(frame, [630, 650], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tryOpacity = interpolate(frame, [610, 630], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tryY = interpolate(frame, [610, 630], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const razeOpacity = interpolate(frame, [625, 645], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const razeY = interpolate(frame, [625, 645], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaGlow = interpolate(frame, [630, 660], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none'}}>
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0,0,0,${overlayOpacity})`,
        }}
      />
      {/* Centered stack */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          fontFamily: typography.stack,
          color: 'white',
        }}
      >
        <img
          src={mascotSrc}
          alt=""
          style={{
            width: 160,
            height: 160,
            objectFit: 'contain',
            opacity: mascotOpacity,
            transform: `translateY(${mascotYSpring}px) scale(${floatScale})`,
            filter: `drop-shadow(0 0 24px rgba(153,69,255,${0.7 * mascotShadow}))`,
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            opacity: tryOpacity,
            transform: `translateY(${tryY}px)`,
          }}
        >
          Try it now at
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: colors.purple,
            opacity: razeOpacity,
            transform: `translateY(${razeY}px)`,
            textShadow: `0 0 ${32 * ctaGlow}px rgba(153,69,255,${0.6 * ctaGlow}), 0 0 ${60 * ctaGlow}px rgba(153,69,255,${0.3 * ctaGlow})`,
            letterSpacing: '-0.01em',
          }}
        >
          raze.fun
        </div>
      </div>
    </div>
  );
};
