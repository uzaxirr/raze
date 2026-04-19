import {AbsoluteFill, useCurrentFrame, useVideoConfig, Easing, interpolate} from 'remotion';
import {BackgroundScene} from './BackgroundScene';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {UserBubble, RazeBubble} from './Bubbles';
import {BEATS, SCROLL_STOPS} from './beats';
import {EndCard} from './EndCard';
import {FilmGrain} from './FilmGrain';
import {colors, phone, camera, mascotSrc} from './tokens';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** Linear interp with shared easing, used for scroll + camera. */
const ease = (frame: number, inRange: [number, number], outRange: [number, number]) =>
  interpolate(frame, inRange, outRange, {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Compute scroll offset (chat scrolls up as beats accumulate). */
function computeScroll(frame: number): number {
  let offset = 0;
  for (const s of SCROLL_STOPS) {
    if (frame >= s.end) offset = s.to;
    else if (frame >= s.start) {
      offset = ease(frame, [s.start, s.end], [s.from, s.to]);
      return offset;
    } else return offset;
  }
  return offset;
}

/** Lerp a rgb triple. */
const lerpRgb = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

export const RazeVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // --- Camera choreography ----------------------------------------------
  const bubbleCenterY = phone.TOTAL_HEADER + 40;
  const inputCenterY = phone.H * 0.55;
  const baseScale = Math.min((width * 0.5) / phone.W, (height * 0.88) / phone.H);

  let camScale = 1.0;
  let camTranslateY = 0;
  if (frame <= camera.HOLD_END) {
    camScale = 1.4;
    camTranslateY = phone.H / 2 - bubbleCenterY;
  } else if (frame <= camera.ZOOM_END) {
    camScale = ease(frame, [camera.HOLD_END, camera.ZOOM_END], [1.4, 1.0]);
    camTranslateY = ease(
      frame,
      [camera.HOLD_END, camera.ZOOM_END],
      [phone.H / 2 - bubbleCenterY, 0],
    );
  } else if (frame <= camera.ZOOM2_START) {
    camScale = 1.0;
    camTranslateY = 0;
  } else if (frame <= camera.ZOOM2_END) {
    camScale = ease(frame, [camera.ZOOM2_START, camera.ZOOM2_END], [1.0, 1.8]);
    camTranslateY = ease(
      frame,
      [camera.ZOOM2_START, camera.ZOOM2_END],
      [0, phone.H / 2 - inputCenterY],
    );
  } else if (frame <= camera.END_START) {
    camScale = 1.8;
    camTranslateY = phone.H / 2 - inputCenterY;
  } else {
    camScale = ease(frame, [camera.END_START, 650], [1.8, 0.65]);
    camTranslateY = ease(
      frame,
      [camera.END_START, 650],
      [phone.H / 2 - inputCenterY, 0],
    );
  }

  // --- Chrome opacity ---------------------------------------------------
  const chromeOpacity = interpolate(
    frame,
    [camera.HOLD_END, camera.ZOOM_END + 4],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // --- Outer canvas background color transitions -----------------------
  // Start: #f7f7f8 (matches screen) — so the edge is invisible.
  // Blends to (232, 236, 241) as chromeOpacity rises.
  // Then to #0a0a0f (10, 10, 15) as ctaDark rises.
  const ctaDark = interpolate(frame, [560, 610], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const startRgb = [247, 247, 248]; // #f7f7f8
  const midRgb = [232, 236, 241];
  const endRgb = [10, 10, 15]; // #0a0a0f
  const blend1 = lerpRgb(startRgb, midRgb, chromeOpacity);
  const blendFinal = lerpRgb(blend1, endRgb, ctaDark);
  const outerBg = `rgb(${blendFinal[0]}, ${blendFinal[1]}, ${blendFinal[2]})`;

  // --- End-card purple glow ring around the phone ----------------------
  const endGlow = interpolate(frame, [620, 650], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --- Scroll offset ----------------------------------------------------
  const scrollOffset = computeScroll(frame);

  // --- Layers ----------------------------------------------------------
  return (
    <AbsoluteFill style={{background: outerBg, overflow: 'hidden'}}>
      {/* Dark animated background — faded in as ctaDark rises */}
      <div style={{position: 'absolute', inset: 0, opacity: ctaDark}}>
        <BackgroundScene frame={frame} ctaDark={ctaDark} />
      </div>

      {/* Phone wrapper — camera transform applied here */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
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
            transition: 'none',
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
                endGlow > 0 ? `, 0 0 60px ${endGlow * 1}px rgba(153,69,255,${0.4 * endGlow})` : ''
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
                {BEATS.map((beat, i) => (
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

      {/* CTA End Card */}
      <EndCard frame={frame} mascotSrc={mascotSrc} />

      {/* Film grain — always last, on top */}
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
