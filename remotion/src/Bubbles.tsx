import {interpolate} from 'remotion';
import {colors, typography} from './tokens';

/**
 * User bubble (right-aligned, iMessage blue) with typewriter + entrance.
 */
export const UserBubble: React.FC<{
  text: string;
  startFrame: number;
  cpf: number; // chars per frame
  timestamp?: string;
  frame: number;
}> = ({text, startFrame, cpf, timestamp = '9:41', frame}) => {
  if (frame < startFrame) return null;

  const elapsed = frame - startFrame;
  const typedLen = Math.max(0, Math.floor(elapsed * cpf));
  const displayed = text.substring(0, typedLen);
  const fullyTyped = typedLen >= text.length;
  const cursorOn = !fullyTyped && Math.floor(frame / 8) % 2 === 0;

  const opacity = interpolate(elapsed, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // scale 0.88 → 1.03 → 1.0 across 15 frames (bounce-in)
  const s1 = interpolate(elapsed, [0, 9], [0.88, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s2 = interpolate(elapsed, [9, 15], [1.03, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = elapsed < 9 ? s1 : s2;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0 12px',
        marginBottom: 4,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom right',
          background: colors.bubbleUser,
          color: 'white',
          borderRadius: '18px 18px 4px 18px',
          padding: '9px 13px 6px',
          fontSize: 14,
          fontFamily: typography.stack,
          maxWidth: '78%',
          lineHeight: 1.4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          {displayed}
          {cursorOn && <span style={{opacity: 0.8}}>|</span>}
        </div>
        {fullyTyped && (
          <div
            style={{
              marginTop: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 3,
              color: colors.bubbleUserMeta,
              fontSize: 10,
            }}
          >
            <span>{timestamp}</span>
            <span>✓✓</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Raze bot bubble (left-aligned, grey) with mascot avatar + per-line fade-in.
 */
export const RazeBubble: React.FC<{
  lines: {text: string; frame: number}[];
  mascotSrc: string;
  timestamp?: string;
  frame: number;
}> = ({lines, mascotSrc, timestamp = '9:41', frame}) => {
  const firstVisible = lines[0].frame;
  if (frame < firstVisible) return null;

  const entOpacity = interpolate(frame, [firstVisible, firstVisible + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lastLineFrame = lines[lines.length - 1].frame;
  const showTimestamp = frame > lastLineFrame + 8;

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '0 12px',
        marginBottom: 6,
        alignItems: 'flex-end',
        opacity: entOpacity,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: 'transparent',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={mascotSrc}
          alt=""
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </div>
      <div
        style={{
          background: colors.bubbleBot,
          color: colors.textPrimary,
          borderRadius: '18px 18px 18px 4px',
          padding: '9px 13px 6px',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: typography.stack,
          maxWidth: '78%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {lines.map((ln, i) => {
          const lineOpacity = interpolate(frame, [ln.frame, ln.frame + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const ty = interpolate(frame, [ln.frame, ln.frame + 10], [6, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                opacity: lineOpacity,
                transform: `translateY(${ty}px)`,
              }}
            >
              {ln.text}
            </div>
          );
        })}
        {showTimestamp && (
          <div
            style={{
              marginTop: 2,
              fontSize: 10,
              color: colors.bubbleBotMeta,
            }}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
};
