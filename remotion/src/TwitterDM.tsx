import {interpolate, Easing} from 'remotion';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** A single DM conversation in the Twitter/X dark-theme DM list. */
interface DMProps {
  kolName: string;
  kolHandle: string;
  kolAvatar: string; // single letter or emoji fallback
  message: string;
  sentFrame: number;
  seenFrame: number;
  frame: number;
}

const DM: React.FC<DMProps> = ({kolName, kolHandle, kolAvatar, message, sentFrame, seenFrame, frame}) => {
  if (frame < sentFrame) return null;

  const elapsed = frame - sentFrame;
  const opacity = interpolate(elapsed, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const slideY = interpolate(elapsed, [0, 10], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  const showSeen = frame >= seenFrame;
  const seenOpacity = showSeen
    ? interpolate(frame, [seenFrame, seenFrame + 10], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  // Typing dots that appear between sent and seen
  const typedLen = Math.max(0, Math.floor(elapsed * 0.7));
  const displayed = message.substring(0, typedLen);
  const fullyTyped = typedLen >= message.length;
  const cursorOn = !fullyTyped && Math.floor(frame / 8) % 2 === 0;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px 20px',
        borderBottom: '1px solid #2f3336',
      }}
    >
      {/* KOL header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#2f3336',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#e7e9ea',
            fontWeight: 700,
          }}
        >
          {kolAvatar}
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <span style={{color: '#e7e9ea', fontSize: 14, fontWeight: 700}}>{kolName}</span>
          <span style={{color: '#71767b', fontSize: 13}}>{kolHandle}</span>
        </div>
      </div>

      {/* Sent message */}
      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
        <div
          style={{
            background: '#1d9bf0',
            color: 'white',
            borderRadius: '18px 18px 4px 18px',
            padding: '10px 14px',
            fontSize: 14,
            maxWidth: '80%',
            lineHeight: 1.4,
            fontFamily: '-apple-system, system-ui, sans-serif',
          }}
        >
          {displayed}
          {cursorOn && <span style={{opacity: 0.6}}>|</span>}
        </div>
      </div>

      {/* Seen indicator — no reply */}
      {showSeen && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 6,
            opacity: seenOpacity,
          }}
        >
          <span style={{color: '#71767b', fontSize: 12}}>Seen</span>
          <span style={{color: '#71767b', fontSize: 10}}>·</span>
          <span style={{color: '#71767b', fontSize: 12}}>no reply</span>
        </div>
      )}
    </div>
  );
};

/** Twitter/X DM inbox screen — dark theme. Shows 3 unanswered DMs. */
export const TwitterDMScreen: React.FC<{frame: number}> = ({frame}) => {
  // Counter animation: "0/47 replies today"
  const counterStart = 190;
  const counterOpacity = interpolate(frame, [counterStart, counterStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const counterY = interpolate(frame, [counterStart, counterStart + 18], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  // "sound familiar?" text
  const familiarStart = 220;
  const familiarOpacity = interpolate(frame, [familiarStart, familiarStart + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* X/Twitter DM header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2f3336',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{color: '#e7e9ea', fontSize: 18, fontWeight: 700}}>Messages</span>
        <div style={{display: 'flex', gap: 16}}>
          <span style={{color: '#e7e9ea', fontSize: 16}}>⚙</span>
          <span style={{color: '#e7e9ea', fontSize: 16}}>✉</span>
        </div>
      </div>

      {/* Search bar */}
      <div style={{padding: '8px 20px'}}>
        <div
          style={{
            background: '#202327',
            borderRadius: 20,
            padding: '10px 16px',
            color: '#71767b',
            fontSize: 14,
          }}
        >
          🔍 Search Direct Messages
        </div>
      </div>

      {/* DM conversations */}
      <div style={{flex: 1, overflow: 'hidden'}}>
        <DM
          kolName="Ansem"
          kolHandle="@blknoiz06"
          kolAvatar="A"
          message="is $WIF still a buy at 2.3?"
          sentFrame={20}
          seenFrame={65}
          frame={frame}
        />
        <DM
          kolName="Murad"
          kolHandle="@MustStopMurad"
          kolAvatar="M"
          message="any alpha on new launches?"
          sentFrame={80}
          seenFrame={125}
          frame={frame}
        />
        <DM
          kolName="Pentoshi"
          kolHandle="@Pentosh1"
          kolAvatar="P"
          message="thoughts on this pump.fun token?"
          sentFrame={140}
          seenFrame={180}
          frame={frame}
        />
      </div>

      {/* Counter + familiar text */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            opacity: counterOpacity,
            transform: `translateY(${counterY}px)`,
            color: '#f4212e',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          0 / 47 replies today
        </div>
        <div
          style={{
            opacity: familiarOpacity,
            color: '#71767b',
            fontSize: 15,
          }}
        >
          sound familiar?
        </div>
      </div>
    </div>
  );
};
