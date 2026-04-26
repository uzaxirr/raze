import {AbsoluteFill, useCurrentFrame, useVideoConfig, Easing, interpolate, Audio, staticFile} from 'remotion';
import {loadFont as loadSpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {UserBubble, RazeBubble} from './Bubbles';
import {SOCIAL_BEATS, SOCIAL_SCROLL_STOPS} from './socialBeats';
import {colors, phone, typography, mascotSrc} from './tokens';

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
  for (const s of SOCIAL_SCROLL_STOPS) {
    if (frame >= s.end) offset = s.to;
    else if (frame >= s.start) {
      offset = ease(frame, [s.start, s.end], [s.from, s.to]);
      return offset;
    } else return offset;
  }
  return offset;
}

/** End card for social video — simpler, square format. */
const SocialEndCard: React.FC<{frame: number}> = ({frame}) => {
  const overlayOpacity = interpolate(frame, [400, 420], [0, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < 400) return null;

  const mascotOpacity = interpolate(frame, [410, 430], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const mascotY = interpolate(frame, [410, 435], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const floatScale = frame > 435 ? 1 + Math.sin((frame - 435) * 0.08) * 0.02 : 1;

  const titleOpacity = interpolate(frame, [425, 445], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [425, 445], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [440, 460], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleY = interpolate(frame, [440, 460], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [455, 475], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaGlow = interpolate(frame, [460, 490], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          fontFamily: inter,
          color: 'white',
        }}
      >
        <img
          src={mascotSrc}
          alt=""
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
            opacity: mascotOpacity,
            transform: `translateY(${mascotY}px) scale(${floatScale})`,
            filter: `drop-shadow(0 0 20px rgba(153,69,255,${0.6 * mascotOpacity}))`,
          }}
        />
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: colors.purple,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textShadow: `0 0 ${28 * ctaGlow}px rgba(153,69,255,${0.5 * ctaGlow})`,
            letterSpacing: '-0.02em',
          }}
        >
          raze.fun
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          everything solana in one chat
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.5)',
            opacity: ctaOpacity,
            marginTop: 4,
            fontFamily: inter,
          }}
        >
          try it free
        </div>
      </div>
    </div>
  );
};

export const RazeSocial: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Phone scale — large but contained within frame
  const baseScale = Math.min((width * 0.44) / phone.W, (height * 0.72) / phone.H);

  // Simple camera: zoom into chat area at start, pull out for end card
  let camScale = 1.0;
  let camTranslateY = 0;
  const bubbleCenterY = phone.TOTAL_HEADER + 40;

  if (frame <= 10) {
    camScale = 1.3;
    camTranslateY = phone.H / 2 - bubbleCenterY;
  } else if (frame <= 35) {
    camScale = ease(frame, [10, 35], [1.3, 1.0]);
    camTranslateY = ease(frame, [10, 35], [phone.H / 2 - bubbleCenterY, 0]);
  } else if (frame <= 380) {
    camScale = 1.0;
    camTranslateY = 0;
  } else {
    camScale = ease(frame, [380, 420], [1.0, 0.75]);
    camTranslateY = 0;
  }

  // Chrome opacity — fade in as camera pulls out
  const chromeOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Background color transitions
  const ctaDark = interpolate(frame, [390, 420], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scroll
  const scrollOffset = computeScroll(frame);

  // End glow
  const endGlow = interpolate(frame, [420, 450], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline entrance
  const headlineOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineY = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Fade out headline for end card
  const headlineFade = interpolate(frame, [390, 410], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #E8DFFF 0%, #F4EFFF 30%, #EDE5FF 70%, #DDD5F5 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Dark overlay for end card */}
      {ctaDark > 0 && (
        <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${ctaDark * 0.85})`, zIndex: 1}} />
      )}

      {/* Headline above phone */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          opacity: headlineOpacity * headlineFade,
          transform: `translateY(${headlineY}px)`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: spaceGrotesk,
            fontSize: 44,
            fontWeight: 700,
            color: '#1A0A2E',
            textAlign: 'center',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
          }}
        >
          what if your wallet<br/>could <span style={{color: colors.purple}}>talk back</span>?
        </div>
      </div>

      {/* Phone — large, bottom bleeds off frame like reference image */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: phone.W,
            height: phone.H,
            position: 'relative',
            transform: `scale(${baseScale * camScale}) translateY(${camTranslateY}px)`,
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
              boxShadow: `0 0 0 1px ${colors.phoneFrameEdge}, 0 30px 80px rgba(0,0,0,0.6)${
                endGlow > 0 ? `, 0 0 50px ${endGlow * 1}px rgba(153,69,255,${0.35 * endGlow})` : ''
              }`,
              opacity: chromeOpacity,
            }}
          />
          {/* Side buttons */}
          <div style={{opacity: chromeOpacity}}>
            <div style={{position: 'absolute', left: -2, top: 140, width: 4, height: 32, background: colors.phoneFrame, borderRadius: 2}} />
            <div style={{position: 'absolute', left: -2, top: 190, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
            <div style={{position: 'absolute', left: -2, top: 265, width: 4, height: 36, background: colors.phoneFrame, borderRadius: 2}} />
            <div style={{position: 'absolute', right: -2, top: 190, width: 4, height: 90, background: colors.phoneFrame, borderRadius: 2}} />
          </div>

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
                opacity: chromeOpacity,
              }}
            />
            <StatusBar opacity={chromeOpacity} />
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
                {SOCIAL_BEATS.map((beat, i) => (
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

      {/* End card */}
      <SocialEndCard frame={frame} />

      {/* Background music */}
      <Audio src={staticFile('music/bg-music.mp3')} volume={0.4} />
    </AbsoluteFill>
  );
};
