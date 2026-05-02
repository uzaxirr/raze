import {AbsoluteFill, useCurrentFrame, useVideoConfig, Easing, interpolate, Audio, staticFile} from 'remotion';
import {loadFont as loadSpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {UserBubble, RazeBubble} from './Bubbles';
import {TwitterFeedScreen} from './TwitterFeed';
import {KOL_BEATS, KOL_SCROLL_STOPS} from './kolBeats';
import {colors, phone, mascotSrc} from './tokens';

const {fontFamily: spaceGrotesk} = loadSpaceGrotesk();
const {fontFamily: inter} = loadInter();

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

const ease = (frame: number, inRange: [number, number], outRange: [number, number]) =>
  interpolate(frame, inRange, outRange, {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

function computeScroll(frame: number): number {
  let offset = 0;
  for (const s of KOL_SCROLL_STOPS) {
    if (frame >= s.end) offset = s.to;
    else if (frame >= s.start) {
      offset = ease(frame, [s.start, s.end], [s.from, s.to]);
      return offset;
    } else return offset;
  }
  return offset;
}

/*
 * Timeline (1020 frames = 34s @ 30fps):
 *
 * Part 1 — Twitter/X (frames 0–395, 0–13.2s)
 *   Scene 1 (0–170):   Ansem tweet + 3 replies + time aging + "Active now"
 *   Cut flash (172)
 *   Scene 2 (178–340):  Murad tweet + 3 replies + time aging
 *   Scene 3 (340–395):  Zoom into worst reply → "430 replies. 0 answers."
 *
 * Transition (frames 395–420, 13.2–14s)
 *   White flash, bg shifts black → lavender
 *
 * Part 2 — Raze Chat (frames 420–800, 14–26.7s)
 *   Beat 1: "is $WIF safe to buy at 2.3?" → full security scan (mirrors Ansem reply)
 *   Beat 2: "who's the top whale buying WIF?" → whale intel + win rate
 *   Beat 3: "check $DOGGO someone told me to ape" → rug detection (mirrors Murad reply)
 *   Beat 4: "am i up or down this month?" → portfolio P&L
 *   Beat 5: "swap 2 SOL to WIF" → instant action
 *
 * End Card (frames 800–1020, 26.7–34s)
 *   "stop waiting for a reply" + mascot + raze.fun + "answered in 0.3s"
 */

/** End card */
const KolEndCard: React.FC<{frame: number}> = ({frame}) => {
  const overlayOpacity = interpolate(frame, [840, 870], [0, 0.9], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  if (frame < 840) return null;

  // Mascot
  const mascotOpacity = interpolate(frame, [855, 875], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const springT = Math.min(1, Math.max(0, (frame - 855) / 25));
  const springOvershoot =
    springT < 1
      ? 1 - Math.pow(1 - springT, 3) + Math.sin(springT * Math.PI * 1.5) * 0.15 * (1 - springT)
      : 1;
  const mascotY = (1 - springOvershoot) * 100;
  const floatScale = frame > 880 ? 1 + Math.sin((frame - 880) * 0.08) * 0.02 : 1;

  // "stop waiting for a reply"
  const taglineOpacity = interpolate(frame, [880, 900], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [880, 900], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // raze.fun
  const titleOpacity = interpolate(frame, [895, 920], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [895, 920], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Glow
  const ctaGlow = interpolate(frame, [910, 960], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Sub text
  const subOpacity = interpolate(frame, [930, 950], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})`}} />
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, fontFamily: inter, color: 'white',
        }}
      >
        <img
          src={mascotSrc} alt=""
          style={{
            width: 120, height: 120, objectFit: 'contain',
            opacity: mascotOpacity,
            transform: `translateY(${mascotY}px) scale(${floatScale})`,
            filter: `drop-shadow(0 0 24px rgba(153,69,255,${0.6 * mascotOpacity}))`,
          }}
        />
        <div style={{
          fontSize: 28, fontWeight: 500, color: 'rgba(255,255,255,0.8)',
          opacity: taglineOpacity, transform: `translateY(${taglineY}px)`,
          textAlign: 'center', lineHeight: 1.3,
        }}>
          stop waiting for a reply
        </div>
        <div style={{
          fontSize: 52, fontWeight: 800, color: colors.purple,
          opacity: titleOpacity, transform: `translateY(${titleY}px)`,
          textShadow: `0 0 ${32 * ctaGlow}px rgba(153,69,255,${0.5 * ctaGlow})`,
          letterSpacing: '-0.02em',
        }}>
          raze.fun
        </div>
        <div style={{
          fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.5)',
          opacity: subOpacity, marginTop: 4,
        }}>
          everything solana in one chat
        </div>
      </div>
    </div>
  );
};

export const RazeKolDM: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // --- Transition: Twitter ends ~395, flash 395–420, Raze from 420 ---
  const dmOpacity = interpolate(frame, [390, 410], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const flashOpacity = interpolate(frame, [398, 406, 412, 422], [0, 0.95, 0.95, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const razeOpacity = interpolate(frame, [410, 430], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // --- Phone ---
  const baseScale = Math.min((width * 0.44) / phone.W, (height * 0.72) / phone.H);

  let camScale = 1.0;
  if (frame < 420) {
    camScale = 1.15;
  } else if (frame <= 440) {
    camScale = ease(frame, [420, 440], [1.15, 1.0]);
  } else if (frame <= 820) {
    camScale = 1.0;
  } else {
    camScale = ease(frame, [820, 860], [1.0, 0.75]);
  }

  const chromeOpacity = interpolate(frame, [420, 435], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const endGlow = interpolate(frame, [850, 880], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const scrollOffset = computeScroll(frame);

  // Background: black → lavender → dark
  const bgPhase1 = interpolate(frame, [395, 425], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bgPhase2 = interpolate(frame, [830, 860], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const bgR = Math.round(interpolate(bgPhase1, [0, 1], [0, 232]) * (1 - bgPhase2) + 10 * bgPhase2);
  const bgG = Math.round(interpolate(bgPhase1, [0, 1], [0, 223]) * (1 - bgPhase2) + 10 * bgPhase2);
  const bgB = Math.round(interpolate(bgPhase1, [0, 1], [0, 255]) * (1 - bgPhase2) + 15 * bgPhase2);

  // Headline
  const headlineOpacity = interpolate(frame, [425, 445], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) * interpolate(frame, [825, 840], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const headlineY = interpolate(frame, [425, 445], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: `rgb(${bgR},${bgG},${bgB})`, overflow: 'hidden'}}>

      {/* ═══════ PART 1: Twitter/X Feed ═══════ */}
      {frame < 420 && (
        <div style={{position: 'absolute', inset: 0, opacity: dmOpacity}}>
          <TwitterFeedScreen frame={frame} />
        </div>
      )}

      {/* ═══════ WHITE FLASH TRANSITION ═══════ */}
      {flashOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(255,255,255,${flashOpacity})`,
          zIndex: 100,
        }} />
      )}

      {/* ═══════ PART 2: Raze Chat ═══════ */}
      {frame >= 410 && (
        <div style={{position: 'absolute', inset: 0, opacity: razeOpacity}}>

          {/* Headline */}
          <div style={{
            position: 'absolute', top: 40, left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: headlineOpacity, transform: `translateY(${headlineY}px)`, zIndex: 2,
          }}>
            <div style={{
              fontFamily: spaceGrotesk, fontSize: 42, fontWeight: 700,
              color: '#1A0A2E', textAlign: 'center', lineHeight: 1.15, letterSpacing: '-0.03em',
            }}>
              raze <span style={{color: colors.purple}}>answers</span>.
            </div>
          </div>

          {/* Phone */}
          <div style={{
            position: 'absolute', top: 160, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          }}>
            <div style={{
              width: phone.W, height: phone.H, position: 'relative',
              transform: `scale(${baseScale * camScale})`, transformOrigin: '50% 50%',
            }}>
              {/* Outer frame */}
              <div style={{
                position: 'absolute', inset: 0, background: colors.phoneFrame,
                borderRadius: phone.CORNER_OUTER,
                boxShadow: `0 0 0 1px ${colors.phoneFrameEdge}, 0 30px 80px rgba(0,0,0,0.6)${
                  endGlow > 0 ? `, 0 0 60px ${endGlow * 1}px rgba(153,69,255,${0.4 * endGlow})` : ''
                }`,
                opacity: chromeOpacity,
              }} />
              {/* Side buttons */}
              <div style={{opacity: chromeOpacity}}>
                <div style={{position: 'absolute', left: -2, top: 140, width: 4, height: 32, background: colors.phoneFrame, borderRadius: 2}} />
                <div style={{position: 'absolute', left: -2, top: 190, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
                <div style={{position: 'absolute', left: -2, top: 265, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
                <div style={{position: 'absolute', right: -2, top: 190, width: 4, height: 90, background: colors.phoneFrame, borderRadius: 2}} />
              </div>

              {/* Screen */}
              <div style={{
                position: 'absolute', top: phone.BEZEL, left: phone.BEZEL, right: phone.BEZEL, bottom: phone.BEZEL,
                borderRadius: phone.CORNER_SCREEN, background: colors.phoneScreen, overflow: 'hidden',
              }}>
                {/* Dynamic Island */}
                <div style={{
                  position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                  width: 126, height: 37, background: '#000', borderRadius: 20, zIndex: 20, opacity: chromeOpacity,
                }} />
                <StatusBar opacity={chromeOpacity} />
                <ChatHeader mascotSrc={mascotSrc} />

                {/* Chat area */}
                <div style={{
                  position: 'absolute', top: phone.TOTAL_HEADER, left: 0, right: 0, bottom: phone.COMPOSER_H,
                  background: colors.chatBg, overflow: 'hidden',
                }}>
                  <div style={{
                    transform: `translateY(${-scrollOffset}px)`,
                    paddingTop: 12, paddingBottom: 12,
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    {KOL_BEATS.map((beat, i) => (
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
        </div>
      )}

      {/* ═══════ END CARD ═══════ */}
      <KolEndCard frame={frame} />

      {/* Background music */}
      <Audio src={staticFile('music/kol-dm-bg.mp3')} volume={0.5} />
    </AbsoluteFill>
  );
};
