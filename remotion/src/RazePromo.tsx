import {
  AbsoluteFill,
  Audio,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {BackgroundScene} from './BackgroundScene';
import {FilmGrain} from './FilmGrain';
import {UserBubble, RazeBubble} from './Bubbles';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {colors, phone, typography, mascotSrc} from './tokens';

// ─── Scene clip table ─────────────────────────────────────────────────────────
const CLIPS: {file: string; from: number; duration: number}[] = [
  {file: 'scenes/01-trade-here.mp4',       from: 0,   duration: 45},
  {file: 'scenes/02-roulette.mp4',          from: 45,  duration: 45},
  {file: 'scenes/03-dumpster.mp4',          from: 90,  duration: 45},
  {file: 'scenes/04-platforms.mp4',         from: 135, duration: 60},
  {file: 'scenes/05-nothing-connects.mp4',  from: 195, duration: 45},
  {file: 'scenes/06-friction.mp4',          from: 240, duration: 45},
  {file: 'scenes/07-the-one.mp4',           from: 285, duration: 60},
  {file: 'scenes/08-trading-ui.mp4',        from: 345, duration: 30},
  {file: 'scenes/09-play.mp4',              from: 375, duration: 30},
  {file: 'scenes/10-all-in-one.mp4',        from: 405, duration: 30},
  {file: 'scenes/11-coins.mp4',             from: 435, duration: 30},
  {file: 'scenes/12-hype.mp4',              from: 465, duration: 45},
];

// ─── Chat beats for Part 2 (local frame = composition frame - 510) ────────────
// Each beat fires at a local frame offset so it fills the 270-frame window.
type ChatLine = {text: string; frame: number};
type ChatBeat = {
  user: {text: string; startFrame: number; cpf: number};
  bot: {lines: ChatLine[]};
};

const CHAT_BEATS: ChatBeat[] = [
  {
    user: {text: 'is $WIF safe?', startFrame: 15, cpf: 0.7},
    bot: {
      lines: [
        {text: 'score: 8/8 ✅', frame: 36},
        {text: 'no mint authority, lp burned, clean 🔥', frame: 44},
      ],
    },
  },
  {
    user: {text: 'swap 5 SOL to USDC', startFrame: 80, cpf: 1.0},
    bot: {
      lines: [
        {text: 'done.', frame: 96},
        {text: '5 SOL → 847.50 USDC via jupiter 🫡', frame: 103},
      ],
    },
  },
  {
    user: {text: 'watch toly.sol', startFrame: 148, cpf: 1.0},
    bot: {
      lines: [
        {text: 'watching. you\'ll know when they move 👀', frame: 162},
      ],
    },
  },
  {
    user: {text: 'alert me when whales buy BONK', startFrame: 200, cpf: 0.9},
    bot: {
      lines: [
        {text: 'alert set.', frame: 234},
        {text: 'pinging you when it happens 🐋', frame: 241},
      ],
    },
  },
];

// Scroll stops for chat (local frames)
const SCROLL_STOPS = [
  {start: 70,  end: 92,  from: 0,   to: 80},
  {start: 135, end: 155, from: 80,  to: 190},
  {start: 190, end: 210, from: 190, to: 280},
];

function computeScroll(localFrame: number): number {
  let offset = 0;
  for (const s of SCROLL_STOPS) {
    if (localFrame >= s.end) {
      offset = s.to;
    } else if (localFrame >= s.start) {
      offset = interpolate(localFrame, [s.start, s.end], [s.from, s.to], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return offset;
    } else {
      return offset;
    }
  }
  return offset;
}

// ─── Part 2: Chat Demo (frames 510–780 in composition) ───────────────────────
const ChatDemo: React.FC<{frame: number}> = ({frame}) => {
  // frame here is the LOCAL frame (composition frame - 510)
  const scrollOffset = computeScroll(frame);

  const baseScale = Math.min((1080 * 0.38) / phone.W, (1920 * 0.82) / phone.H);

  // Fade in the phone from the start
  const phoneOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endGlow = interpolate(frame, [240, 270], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <BackgroundScene frame={frame} ctaDark={1} />

      {/* Phone wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: phoneOpacity,
        }}
      >
        <div
          style={{
            width: phone.W,
            height: phone.H,
            position: 'relative',
            transform: `scale(${baseScale})`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Outer frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: colors.phoneFrame,
              borderRadius: phone.CORNER_OUTER,
              boxShadow: `0 0 0 1px ${colors.phoneFrameEdge}, 0 30px 80px rgba(0,0,0,0.8)${
                endGlow > 0
                  ? `, 0 0 60px ${endGlow}px rgba(153,69,255,${0.4 * endGlow})`
                  : ''
              }`,
            }}
          />

          {/* Side buttons */}
          <div style={{position: 'absolute', left: -2, top: 140, width: 4, height: 32, background: colors.phoneFrame, borderRadius: 2}} />
          <div style={{position: 'absolute', left: -2, top: 190, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
          <div style={{position: 'absolute', left: -2, top: 265, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
          <div style={{position: 'absolute', right: -2, top: 190, width: 4, height: 90, background: colors.phoneFrame, borderRadius: 2}} />

          {/* Screen */}
          <div
            style={{
              position: 'absolute',
              top: phone.BEZEL,
              left: phone.BEZEL,
              right: phone.BEZEL,
              bottom: phone.BEZEL,
              borderRadius: phone.CORNER_SCREEN,
              background: colors.phoneScreen,
              overflow: 'hidden',
            }}
          >
            {/* Dynamic Island */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 126,
                height: 37,
                background: '#000',
                borderRadius: 20,
                zIndex: 20,
              }}
            />

            <StatusBar opacity={1} />
            <ChatHeader mascotSrc={mascotSrc} />

            {/* Chat area */}
            <div
              style={{
                position: 'absolute',
                top: phone.TOTAL_HEADER,
                left: 0,
                right: 0,
                bottom: phone.COMPOSER_H,
                background: colors.chatBg,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  transform: `translateY(${-scrollOffset}px)`,
                  paddingTop: 12,
                  paddingBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {CHAT_BEATS.map((beat, i) => (
                  <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8}}>
                    <UserBubble
                      text={beat.user.text}
                      startFrame={beat.user.startFrame}
                      cpf={beat.user.cpf}
                      frame={frame}
                    />
                    <RazeBubble
                      lines={beat.bot.lines}
                      mascotSrc={mascotSrc}
                      frame={frame}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Composer />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Part 3: End Card (frames 780–900 in composition, local = frame - 780) ────
// Mirrors EndCard.tsx but with local frame offsets mapped to 0-120 window.
const PromoEndCard: React.FC<{localFrame: number}> = ({localFrame}) => {
  const overlayOpacity = interpolate(localFrame, [0, 20], [0, 0.82], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Spring entrance for mascot: local frames 10–35
  const springT = Math.min(1, Math.max(0, (localFrame - 10) / 25));
  const springOvershoot =
    springT < 1
      ? 1 - Math.pow(1 - springT, 3) + Math.sin(springT * Math.PI * 1.5) * 0.15 * (1 - springT)
      : 1;
  const mascotYSpring = (1 - springOvershoot) * 120;

  const mascotOpacity = interpolate(localFrame, [5, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const floatScale = localFrame > 35 ? 1 + Math.sin((localFrame - 35) * 0.08) * 0.025 : 1;

  const mascotShadow = interpolate(localFrame, [50, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tryOpacity = interpolate(localFrame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tryY = interpolate(localFrame, [30, 50], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const razeOpacity = interpolate(localFrame, [45, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const razeY = interpolate(localFrame, [45, 65], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaGlow = interpolate(localFrame, [50, 80], [0, 1], {
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

// ─── Main composition ─────────────────────────────────────────────────────────
export const RazePromo: React.FC = () => {
  const frame = useCurrentFrame();

  // Transition overlay: frame 480–510 fades to black, 510–540 fades back in on chat
  const fadeOut = interpolate(frame, [480, 510], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeIn = interpolate(frame, [510, 540], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const transitionBlack = frame < 510 ? fadeOut : fadeIn;

  // Local frame for Part 2 (chat demo)
  const chatLocalFrame = Math.max(0, frame - 510);

  // Local frame for Part 3 (end card)
  const endLocalFrame = Math.max(0, frame - 780);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {/* ── Background music ─────────────────────────────────────────────── */}
      <Audio src={staticFile('music/bg-music.mp3')} volume={0.5} />

      {/* ── Part 1: Problem clips (frames 0–510) ─────────────────────────── */}
      {frame < 510 && (
        <AbsoluteFill>
          {CLIPS.map((clip) => (
            <Sequence key={clip.file} from={clip.from} durationInFrames={clip.duration}>
              <Video
                src={staticFile(clip.file)}
                style={{width: 1080, height: 1920, objectFit: 'cover'}}
              />
            </Sequence>
          ))}
        </AbsoluteFill>
      )}

      {/* ── Part 2: Chat demo (frames 510–780) ───────────────────────────── */}
      {frame >= 510 && frame < 780 && (
        <ChatDemo frame={chatLocalFrame} />
      )}

      {/* ── Part 3: End card (frames 780–900) — sits on top of chat ──────── */}
      {frame >= 780 && (
        <>
          {/* Keep chat visible underneath as base */}
          <ChatDemo frame={270} />
          <PromoEndCard localFrame={endLocalFrame} />
        </>
      )}

      {/* ── Black transition flash between parts 1 and 2 ─────────────────── */}
      {transitionBlack > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            opacity: transitionBlack,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Film grain — always on top ────────────────────────────────────── */}
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
