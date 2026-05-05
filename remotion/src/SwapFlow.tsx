import {Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FilmGrain} from './FilmGrain';
import {UserBubble, RazeBubble} from './Bubbles';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {colors, phone, typography, mascotSrc} from './tokens';

// ---------------------------------------------------------------------------
// Easing / interpolation helpers
// ---------------------------------------------------------------------------

function clamp(frame: number, a: number, b: number, from: number, to: number) {
  return interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function springProgress(frame: number, start: number, duration: number): number {
  const t = Math.min(1, Math.max(0, (frame - start) / duration));
  return t < 1
    ? 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI * 1.5) * 0.15 * (1 - t)
    : 1;
}

// ---------------------------------------------------------------------------
// Shared light lavender background
// ---------------------------------------------------------------------------

const LavenderBg: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)',
    }}
  />
);

// ---------------------------------------------------------------------------
// Phone frame — mirrors RazeVideo's approach exactly
// baseScale fits the phone into the 1080×1920 viewport at ~80% height
// ---------------------------------------------------------------------------

const VIEWPORT_W = 1080;
const VIEWPORT_H = 1920;

// Scale so phone fits 80% of viewport height (matches ~RazeVideo baseScale math)
const BASE_SCALE = Math.min(
  (VIEWPORT_W * 0.82) / phone.W,
  (VIEWPORT_H * 0.82) / phone.H,
);

interface PhoneProps {
  children: React.ReactNode;
  /** Extra transform applied to the phone wrapper (camera zoom etc.) */
  extraTransform?: string;
  opacity?: number;
}

const PhoneFrame: React.FC<PhoneProps> = ({children, extraTransform = '', opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity,
    }}
  >
    <div
      style={{
        width: phone.W,
        height: phone.H,
        position: 'relative',
        transform: `scale(${BASE_SCALE}) ${extraTransform}`,
        transformOrigin: '50% 50%',
      }}
    >
      {/* Outer bezel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: colors.phoneFrame,
          borderRadius: phone.CORNER_OUTER,
          boxShadow: `0 0 0 1px ${colors.phoneFrameEdge}, 0 40px 100px rgba(0,0,0,0.55)`,
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

        {/* Screen content */}
        {children}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Scene 1 — HOOK  (frames 0–60)
// Light lavender bg, dark text
// ---------------------------------------------------------------------------

const Hook: React.FC<{frame: number}> = ({frame}) => {
  const lines: {text: string; color: string; start: number}[] = [
    {text: 'your keys.', color: '#1A1A1A', start: 0},
    {text: 'your wallet.', color: '#1A1A1A', start: 15},
    {text: 'one message.', color: colors.purple, start: 30},
  ];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <LavenderBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: `'Space Grotesk', ${typography.stack}`,
        }}
      >
        {lines.map((ln, i) => {
          const op = clamp(frame, ln.start, ln.start + 15, 0, 1);
          const ty = clamp(frame, ln.start, ln.start + 15, 20, 0);
          return (
            <div
              key={i}
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: ln.color,
                opacity: op,
                transform: `translateY(${ty}px)`,
                letterSpacing: '-0.02em',
              }}
            >
              {ln.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Telegram chat: user bubble — purple dark mode
// ---------------------------------------------------------------------------

/** Purple Telegram-style user bubble for dark mode chat. */
const PurpleUserBubble: React.FC<{
  text: string;
  startFrame: number;
  cpf: number;
  timestamp?: string;
  frame: number;
}> = ({text, startFrame, cpf, timestamp = '9:41', frame}) => {
  if (frame < startFrame) return null;

  const elapsed = frame - startFrame;
  const typedLen = Math.max(0, Math.floor(elapsed * cpf));
  const displayed = text.substring(0, typedLen);
  const fullyTyped = typedLen >= text.length;
  const cursorOn = !fullyTyped && Math.floor(frame / 8) % 2 === 0;

  const opacity = clamp(frame, startFrame, startFrame + 6, 0, 1);
  const s1 = clamp(frame, startFrame, startFrame + 9, 0.88, 1.03);
  const s2 = clamp(frame, startFrame + 9, startFrame + 15, 1.03, 1.0);
  const scale = elapsed < 9 ? s1 : s2;

  return (
    <div style={{display: 'flex', justifyContent: 'flex-end', padding: '0 12px', marginBottom: 4}}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom right',
          background: '#9945FF',
          color: '#fff',
          borderRadius: '16px 16px 4px 16px',
          padding: '9px 13px 6px',
          fontSize: 14,
          fontFamily: typography.stack,
          maxWidth: '78%',
          lineHeight: 1.4,
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      >
        <div>
          {displayed}
          {cursorOn && <span style={{opacity: 0.6}}>|</span>}
        </div>
        {fullyTyped && (
          <div
            style={{
              marginTop: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 3,
              color: 'rgba(255,255,255,0.4)',
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

// Sign transaction inline button (dark mode Telegram style)
const SignBubble: React.FC<{frame: number; startFrame: number}> = ({frame, startFrame}) => {
  if (frame < startFrame) return null;
  const op = clamp(frame, startFrame, startFrame + 10, 0, 1);
  const scale = clamp(frame, startFrame, startFrame + 12, 0.88, 1);
  return (
    <div style={{padding: '4px 12px', marginBottom: 6}}>
      <div
        style={{
          opacity: op,
          transform: `scale(${scale})`,
          background: '#2A2540',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12,
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: typography.stack,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>🔐 Sign Transaction</span>
        <span style={{fontSize: 16, opacity: 0.7}}>↗</span>
      </div>
    </div>
  );
};

// Confirm bubble (scene 7)
const ConfirmBubble: React.FC<{frame: number; startFrame: number}> = ({frame, startFrame}) => {
  if (frame < startFrame) return null;
  const op = clamp(frame, startFrame, startFrame + 10, 0, 1);
  const s1 = clamp(frame, startFrame, startFrame + 8, 0.9, 1.03);
  const s2 = clamp(frame, startFrame + 8, startFrame + 14, 1.03, 1.0);
  const sc = frame < startFrame + 8 ? s1 : s2;

  return (
    <div style={{display: 'flex', gap: 6, padding: '0 12px', marginBottom: 6, alignItems: 'flex-end', opacity: op}}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: '#2A2540',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img src={mascotSrc} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </div>
      <div
        style={{
          background: '#262633',
          color: '#fff',
          borderRadius: '18px 18px 18px 4px',
          padding: '9px 13px 6px',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: typography.stack,
          maxWidth: '78%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transform: `scale(${sc})`,
          transformOrigin: 'bottom left',
        }}
      >
        <div style={{fontWeight: 700}}>✅ Swap confirmed!</div>
        <div>1.0 USDC → 0.011410901 SOL</div>
        <div style={{color: colors.purple, textDecoration: 'underline'}}>View on Solscan</div>
        <div style={{marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.4)'}}>9:41</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Telegram chat area (used by scenes 2 and 7)
// ---------------------------------------------------------------------------

const TelegramChatContent: React.FC<{frame: number; showConfirm?: boolean}> = ({
  frame,
  showConfirm = false,
}) => (
  <>
    <StatusBar opacity={1} />
    <ChatHeader mascotSrc={mascotSrc} />
    <div
      style={{
        position: 'absolute',
        top: phone.TOTAL_HEADER,
        bottom: phone.COMPOSER_H,
        left: 0,
        right: 0,
        background: colors.chatBg,
        overflowY: 'hidden',
        paddingTop: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 2,
      }}
    >
      <PurpleUserBubble
        text="swap 1 usdc to sol"
        startFrame={showConfirm ? -999 : 75}
        cpf={showConfirm ? 99 : 0.9}
        timestamp="9:41"
        frame={frame}
      />
      <RazeBubble
        lines={[
          {text: '1 USDC → 0.0114 SOL via jupiter.', frame: showConfirm ? -999 : 110},
          {text: 'ready to sign.', frame: showConfirm ? -999 : 122},
        ]}
        mascotSrc={mascotSrc}
        timestamp="9:41"
        frame={frame}
      />
      <SignBubble frame={frame} startFrame={showConfirm ? -999 : 150} />
      {showConfirm && <ConfirmBubble frame={frame} startFrame={570} />}
    </div>
    <Composer />
  </>
);

// ---------------------------------------------------------------------------
// TMA screen content (scenes 3, 5, 6)
// ---------------------------------------------------------------------------

const TimerCircle: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 14,
      right: 14,
      width: 40,
      height: 40,
      borderRadius: 20,
      border: `3px solid ${colors.purple}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{fontSize: 11, fontWeight: 600, color: colors.purple, fontFamily: 'monospace'}}>
      9:32
    </span>
  </div>
);

// TMA top bar inside the phone screen — matches real Telegram Mini App browser chrome
// Single row: X close | raze.fun pill (centered) | ••• menu
const TmaTopBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: phone.STATUS_H,
      left: 0,
      right: 0,
      height: 44,
      background: '#FFFFFF',
      borderBottom: `1px solid rgba(0,0,0,0.10)`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* X close button */}
    <div style={{minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 1L13 13M13 1L1 13" stroke="#333" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </div>

    {/* Centered raze.fun pill */}
    <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          background: '#F0F0F5',
          borderRadius: 20,
          padding: '5px 20px',
          minWidth: 140,
          textAlign: 'center',
        }}
      >
        <span style={{fontSize: 13, fontWeight: 500, color: '#333'}}>raze.fun</span>
      </div>
    </div>

    {/* Three-dot menu */}
    <div style={{minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3}}>
      {[0,1,2].map(i => (
        <div key={i} style={{width: 3.5, height: 3.5, borderRadius: '50%', background: '#555'}} />
      ))}
    </div>
  </div>
);

interface TmaContentProps {
  frame: number;
  showWallet?: boolean;
  showSubmitting?: boolean;
  showSuccess?: boolean;
}

const TmaScreenContent: React.FC<TmaContentProps> = ({
  frame,
  showWallet = false,
  showSubmitting = false,
  showSuccess = false,
}) => {
  // Pulsing glow when wallet connected
  const glowPulse = showWallet
    ? (Math.sin(((frame - 300) / 45) * Math.PI * 2) + 1) / 2
    : 0;
  const glowPx = glowPulse * 14;

  // Bouncing dots for submitting
  const dot1 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2) * 6 : 0;
  const dot2 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.45) * 6 : 0;
  const dot3 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.9) * 6 : 0;

  // Checkmark spring for success
  const checkSpring = showSuccess ? springProgress(frame, 480, 18) : 0;
  const checkScale = showSuccess ? (checkSpring > 1.0 ? Math.min(checkSpring, 1.1) : checkSpring) : 0;
  const checkOp = showSuccess ? clamp(frame, 480, 492, 0, 1) : 0;
  const txHashOp = showSuccess ? clamp(frame, 500, 512, 0, 1) : 0;
  const solscanOp = showSuccess ? clamp(frame, 512, 524, 0, 1) : 0;
  const backOp = showSuccess ? clamp(frame, 524, 536, 0, 1) : 0;

  return (
    <>
      <StatusBar opacity={1} />
      <TmaTopBar />

      {/* Lavender page body */}
      <div
        style={{
          position: 'absolute',
          top: phone.STATUS_H + 44,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, #F5F3FF 0%, #EDE8FF 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 14px 14px',
          overflowY: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Mascot + "raze" inline — centered above card */}
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12}}>
          <img src={mascotSrc} alt="" style={{width: 52, height: 52, objectFit: 'contain'}} />
          <span style={{fontSize: 18, fontWeight: 700, color: '#111', fontFamily: typography.stack}}>raze</span>
        </div>

        {/* White card */}
        {!showSuccess && (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '20px 20px 20px',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'relative',
            }}
          >
            {/* Timer circle — top right of card */}
            <TimerCircle />

            {/* Swap heading */}
            <div style={{fontSize: 20, fontWeight: 700, color: '#111', fontFamily: typography.stack, marginBottom: 6}}>
              Swap
            </div>

            {/* MAINNET badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#DCFCE7',
                borderRadius: 20,
                padding: '2px 10px',
                marginBottom: 14,
              }}
            >
              <div style={{width: 6, height: 6, borderRadius: 3, background: '#16A34A', marginRight: 5}} />
              <span style={{fontSize: 9, fontWeight: 700, color: '#16A34A', letterSpacing: '0.06em', fontFamily: typography.stack}}>
                MAINNET
              </span>
            </div>

            {/* Swap inner bordered box */}
            <div
              style={{
                border: '1.5px solid #E5E5EA',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div style={{flex: 1, textAlign: 'left'}}>
                <div style={{fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontFamily: typography.stack}}>YOU PAY</div>
                <div style={{fontSize: 36, fontWeight: 700, color: '#111', lineHeight: 1, fontFamily: typography.stack}}>1</div>
                <div style={{fontSize: 11, color: colors.purple, marginTop: 3, fontFamily: typography.stack, fontWeight: 600}}>USDG</div>
              </div>
              <div style={{fontSize: 18, color: '#999'}}>→</div>
              <div style={{flex: 1, textAlign: 'right'}}>
                <div style={{fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, fontFamily: typography.stack}}>YOU GET</div>
                {/* Solana wave SVG icon */}
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 3}}>
                  <svg width="22" height="16" viewBox="0 0 646 505" fill="none">
                    <path d="M108.53 310.31c4.19-4.19 9.9-6.56 15.88-6.56H626.06c10.01 0 15.02 12.11 7.94 19.19l-107.48 107.48c-4.19 4.19-9.9 6.56-15.88 6.56H9.94c-10.01 0-15.02-12.11-7.94-19.19L108.53 310.31z" fill="#9945FF"/>
                    <path d="M108.53 6.56C112.72 2.37 118.43 0 124.41 0H626.06c10.01 0 15.02 12.11 7.94 19.19L526.52 126.67c-4.19 4.19-9.9 6.56-15.88 6.56H9.94C-.07 133.23-5.08 121.12 2 114.04L108.53 6.56z" fill="#14F195"/>
                    <path d="M526.52 157.61c-4.19-4.19-9.9-6.56-15.88-6.56H9.94c-10.01 0-15.02 12.11-7.94 19.19l107.48 107.48c4.19 4.19 9.9 6.56 15.88 6.56H626.06c10.01 0 15.02-12.11 7.94-19.19L526.52 157.61z" fill="#00C2FF"/>
                  </svg>
                </div>
                <div style={{fontSize: 11, color: colors.purple, fontFamily: typography.stack, fontWeight: 600}}>SOL</div>
              </div>
            </div>

            {/* Transaction for row */}
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
              <span style={{fontSize: 10, color: '#999', fontFamily: typography.stack}}>transaction for:</span>
              <span style={{fontSize: 10, color: '#888', fontFamily: 'monospace'}}>D4M5c6...YgpJ</span>
            </div>

            {/* scan QR | connect wallet outline buttons */}
            <div style={{display: 'flex', gap: 8, marginBottom: showWallet ? 10 : 16, width: '100%', boxSizing: 'border-box'}}>
              <div
                style={{
                  flex: 1,
                  border: '1.5px solid #D1D1D6',
                  borderRadius: 10,
                  background: 'transparent',
                  padding: '8px 0',
                  fontSize: 11,
                  color: '#555',
                  textAlign: 'center',
                  fontFamily: typography.stack,
                }}
              >
                scan QR
              </div>
              <div
                style={{
                  flex: 1,
                  border: '1.5px solid #D1D1D6',
                  borderRadius: 10,
                  background: 'transparent',
                  padding: '8px 0',
                  fontSize: 11,
                  color: '#555',
                  textAlign: 'center',
                  fontFamily: typography.stack,
                }}
              >
                connect wallet
              </div>
            </div>

            {/* Wallet connected rows (scene 3b) */}
            {showWallet && (
              <div style={{marginBottom: 12}}>
                {/* Row 1: green dot + address */}
                <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6}}>
                  <div style={{width: 8, height: 8, borderRadius: 4, background: '#14F195', flexShrink: 0}} />
                  <span style={{fontSize: 11, color: '#333', fontFamily: 'monospace'}}>D4M5c6 ... YqpJ</span>
                </div>
                {/* Row 2: purple icon + address + SOL balance */}
                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${colors.purple}, #6B25E8)`,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{fontSize: 9, color: '#fff', fontWeight: 700}}>◎</span>
                  </div>
                  <span style={{fontSize: 11, color: '#333', fontFamily: 'monospace'}}>D4M5...itYqpJ</span>
                  <span style={{fontSize: 11, color: '#888', fontFamily: 'monospace', marginLeft: 'auto'}}>0.018 SOL</span>
                </div>
              </div>
            )}

            {/* Submitting state */}
            {showSubmitting && !showSuccess && (
              <div style={{textAlign: 'center', marginBottom: 12}}>
                <div style={{fontSize: 11, color: '#555', marginBottom: 8, fontFamily: typography.stack}}>
                  submitting transaction...
                </div>
                <div style={{display: 'flex', justifyContent: 'center', gap: 6}}>
                  {[dot1, dot2, dot3].map((dy, i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: colors.purple,
                        transform: `translateY(${dy}px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Primary CTA button */}
            {!showSubmitting && (
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <div
                  style={{
                    background: colors.purple,
                    borderRadius: 24,
                    padding: showWallet ? '12px 0' : '10px 28px',
                    textAlign: 'center',
                    fontSize: showWallet ? 15 : 14,
                    fontWeight: 700,
                    color: '#fff',
                    width: showWallet ? '100%' : undefined,
                    minWidth: showWallet ? undefined : 180,
                    boxSizing: 'border-box',
                    fontFamily: typography.stack,
                    boxShadow: showWallet
                      ? `0 0 ${glowPx}px ${colors.purpleGlow}, 0 0 ${glowPx * 2}px rgba(153,69,255,0.2)`
                      : 'none',
                  }}
                >
                  {showWallet ? 'sign & send' : 'Connect Wallet'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success card */}
        {showSuccess && (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '28px 20px 24px',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: checkOp,
            }}
          >
            {/* Green checkmark circle */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                background: 'rgba(20,241,149,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                transform: `scale(${checkScale})`,
              }}
            >
              <span style={{fontSize: 30, color: '#14F195', fontWeight: 700, lineHeight: 1}}>✓</span>
            </div>
            <div style={{fontSize: 16, fontWeight: 700, color: '#14F195', marginBottom: 8, fontFamily: typography.stack}}>
              transaction sent
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: '#999',
                marginBottom: 16,
                textAlign: 'center',
                opacity: txHashOp,
              }}
            >
              8ZQs2UezivjXCB6s...4hvF1TmuN6QmyZz2
            </div>
            <div
              style={{
                border: `1.5px solid ${colors.purple}`,
                borderRadius: 24,
                padding: '9px 28px',
                fontSize: 12,
                color: colors.purple,
                fontFamily: typography.stack,
                fontWeight: 600,
                marginBottom: 12,
                opacity: solscanOp,
              }}
            >
              view on solscan
            </div>
            <div style={{fontSize: 12, color: '#aaa', opacity: backOp, fontFamily: typography.stack}}>
              back to telegram
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop: 'auto', paddingTop: 12, fontSize: 10, color: '#bbb', fontFamily: typography.stack, textAlign: 'center'}}>
          raze.fun · @raze_aii
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Phantom screen content (scene 4)
// ---------------------------------------------------------------------------

const PhantomScreenContent: React.FC<{frame: number}> = ({frame}) => {
  const confirmTapScale =
    frame >= 400 && frame < 412
      ? clamp(frame, 400, 406, 1, 0.92)
      : frame >= 406
      ? clamp(frame, 406, 414, 0.92, 1)
      : 1;

  const divider = (
    <div style={{height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0'}} />
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1C1C1E',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: typography.stack,
        overflowY: 'hidden',
      }}
    >
      {/* Status bar area — keep it dark */}
      <div style={{height: phone.STATUS_H, background: '#1C1C1E'}} />

      {/* Telegram nav bar — dark themed, two-row (back + title / lock + url) */}
      <div
        style={{
          height: phone.HEADER_H,
          background: '#2C2C2E',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {/* Top row: back arrow | title | three-dot */}
        <div style={{display: 'flex', alignItems: 'center', padding: '0 10px', height: '55%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 3, minWidth: 28}}>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M6 1L1 6L6 11" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{flex: 1, textAlign: 'center'}}>
            <span style={{fontSize: 13, fontWeight: 600, color: '#fff'}}>Raze — Sign Transaction</span>
          </div>
          <div style={{minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
            <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
              <circle cx="2" cy="2" r="1.5" fill="#aaa"/>
              <circle cx="8" cy="2" r="1.5" fill="#aaa"/>
              <circle cx="14" cy="2" r="1.5" fill="#aaa"/>
            </svg>
          </div>
        </div>
        {/* Bottom row: lock + raze.fun */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: '45%'}}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
            <rect x="1" y="4" width="6" height="5.5" rx="1" fill="#666"/>
            <path d="M2.5 4V2.5C2.5 1.67 3.17 1 4 1C4.83 1 5.5 1.67 5.5 2.5V4" stroke="#666" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{fontSize: 10, color: '#666'}}>raze.fun</span>
        </div>
      </div>

      {/* Phantom dialog content — scrollable body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 16px 12px',
          overflowY: 'hidden',
        }}
      >
        {/* Header row: mascot avatar + raze.fun + X close */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12}}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: '#E8B84B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img src={mascotSrc} alt="" style={{width: '95%', height: '95%', objectFit: 'contain'}} />
          </div>
          <span style={{flex: 1, fontSize: 14, color: '#fff', fontWeight: 600}}>raze.fun</span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{fontSize: 14, color: '#aaa', lineHeight: 1}}>✕</span>
          </div>
        </div>

        {/* Confirm transaction heading */}
        <div style={{fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6}}>
          Confirm transaction
        </div>
        <div style={{fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.6}}>
          Balance changes are estimated. Amounts and assets involved are not guaranteed.
        </div>

        {/* Yellow warning box */}
        <div
          style={{
            background: '#FFF3CD',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            color: '#664D03',
            marginBottom: 0,
            lineHeight: 1.5,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <span style={{fontSize: 14}}>⚠</span>
          <span>This domain is new. Only proceed if you trust this site.</span>
        </div>

        {divider}

        {/* Token rows */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 0}}>
          {/* USDC row */}
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: '#2775CA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <span style={{fontSize: 18, fontWeight: 700, color: '#fff'}}>$</span>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 13, color: '#fff', fontWeight: 500}}>USD Coin</div>
            </div>
            <div style={{fontSize: 13, fontWeight: 700, color: '#FF6B6B'}}>-1 USDC</div>
          </div>

          {/* SOL row */}
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <img
              src={staticFile('coins/sol.png')}
              style={{width: 32, height: 32, borderRadius: 16, objectFit: 'contain', flexShrink: 0}}
              alt="SOL"
            />
            <div style={{flex: 1}}>
              <div style={{fontSize: 13, color: '#fff', fontWeight: 500}}>Solana</div>
            </div>
            <div style={{fontSize: 13, fontWeight: 700, color: '#14F195'}}>+0.011414 SOL</div>
          </div>
        </div>

        {divider}

        {/* Detail rows */}
        {[
          {label: 'Account', value: 'Account 2'},
          {label: 'Network', value: 'Solana'},
          {label: 'Network Fee', value: '0.00009 SOL'},
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            <span style={{color: '#888'}}>{row.label}</span>
            <span style={{color: '#fff', fontWeight: 500}}>{row.value}</span>
          </div>
        ))}

        {/* Advanced row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            marginBottom: 0,
          }}
        >
          <span style={{color: '#888'}}>Advanced</span>
          <span style={{color: '#888', fontSize: 16}}>›</span>
        </div>

        {divider}

        {/* Buttons — each ~45% width */}
        <div style={{display: 'flex', gap: 10, marginTop: 4}}>
          <div
            style={{
              flex: 1,
              background: '#3A3A3C',
              borderRadius: 14,
              padding: '14px 0',
              textAlign: 'center',
              fontSize: 15,
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Close
          </div>
          <div
            style={{
              flex: 1,
              background: colors.purple,
              borderRadius: 14,
              padding: '14px 0',
              textAlign: 'center',
              fontSize: 15,
              color: '#fff',
              fontWeight: 700,
              transform: `scale(${confirmTapScale})`,
            }}
          >
            Confirm
          </div>
        </div>

        {/* Footer text */}
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: '#666',
            textAlign: 'center',
            fontFamily: typography.stack,
          }}
        >
          Only confirm if you trust this website.
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// End Card (frames 660–750) — light bg, dark text
// ---------------------------------------------------------------------------

const SwapEndCard: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 660) return null;

  const phoneFadeOut = clamp(frame, 660, 685, 1, 0);
  const mascotSpring = springProgress(frame, 668, 25);
  const mascotOp = clamp(frame, 662, 678, 0, 1);
  const line1Op = clamp(frame, 682, 698, 0, 1);
  const line1Y = clamp(frame, 682, 698, 14, 0);
  const razeOp = clamp(frame, 696, 712, 0, 1);
  const razeY = clamp(frame, 696, 712, 18, 0);
  const glowT = clamp(frame, 706, 730, 0, 1);
  const taglineOp = clamp(frame, 714, 730, 0, 1);
  const taglineY = clamp(frame, 714, 730, 10, 0);
  const floatScale = frame > 693 ? 1 + Math.sin((frame - 693) * 0.08) * 0.025 : 1;

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none'}}>
      {/* Light lavender replaces bg */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)',
          opacity: clamp(frame, 660, 680, 0, 1),
        }}
      />

      {/* Centered content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          fontFamily: typography.stack,
        }}
      >
        <img
          src={mascotSrc}
          alt=""
          style={{
            width: 140,
            height: 140,
            objectFit: 'contain',
            opacity: mascotOp,
            transform: `translateY(${(1 - mascotSpring) * 80}px) scale(${floatScale})`,
            filter: `drop-shadow(0 0 24px rgba(153,69,255,${0.5 * glowT}))`,
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: '#1A1A1A',
            opacity: line1Op,
            transform: `translateY(${line1Y}px)`,
            textAlign: 'center',
            padding: '0 48px',
            lineHeight: 1.3,
          }}
        >
          your keys never leave your wallet.
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: colors.purple,
            opacity: razeOp,
            transform: `translateY(${razeY}px)`,
            textShadow: `0 0 ${32 * glowT}px rgba(153,69,255,${0.5 * glowT}), 0 0 ${60 * glowT}px rgba(153,69,255,${0.25 * glowT})`,
            letterSpacing: '-0.01em',
          }}
        >
          raze.fun
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#888',
            opacity: taglineOp,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          everything solana · one chat
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root SwapFlow composition
// ---------------------------------------------------------------------------

export const SwapFlow: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene boundaries — non-overlapping crossfade windows (12 frames each)
  // Scene 2: chat         60–210
  // Scene 3: TMA connect  210–330  (crossfade in: 210-222)
  // Scene 3b: TMA wallet  280–330  (crossfade in: 280-292, out: 318-330)
  // Scene 4: Phantom      330–420  (crossfade in: 330-342, out: 408-420)
  // Scene 5: Submitting   420–480  (crossfade in: 420-432, out: 468-480)
  // Scene 6: Success      480–570  (crossfade in: 480-492, out: 558-570)
  // Scene 7: Chat confirm 570–660  (crossfade in: 570-582)
  // Scene 8: End card     660-750

  const showHook = frame < 62;
  const showPhone = frame >= 55 && frame < 665;
  const showTelegramChat = frame >= 55 && frame < 222;
  // TMA connect: fades in at 210, fully gone by 330 (before Phantom starts)
  const showTmaConnect = frame >= 210 && frame < 336;
  // TMA wallet connected: fades in at 280, fully gone by 330
  const showTmaConnected = frame >= 280 && frame < 336;
  // Phantom: fades in at 330, fully gone by 420
  const showPhantom = frame >= 330 && frame < 432;
  const showSubmitting = frame >= 420 && frame < 492;
  const showSuccess = frame >= 480 && frame < 575;
  const showChatConfirm = frame >= 558 && frame < 665;
  const showEndCard = frame >= 660;

  // Phone fade-in (scenes 2+)
  const phoneOpacity = clamp(frame, 55, 72, 0, 1);

  // Cross-fade opacities — quick 6-frame snaps so no two screens are visible simultaneously
  const chatOpacity =
    frame < 60 ? 0 : frame < 210 ? clamp(frame, 60, 72, 0, 1) : clamp(frame, 210, 216, 1, 0);

  // TMA connect: fade in 210-216, hold, snap out 324-330 (fully gone before Phantom at 330)
  const tmaConnectOpacity =
    frame < 210
      ? 0
      : frame < 324
      ? clamp(frame, 210, 216, 0, 1)
      : clamp(frame, 324, 330, 1, 0);

  // TMA wallet connected: fade in 280-286, snap out 324-330
  const tmaConnectedOpacity =
    frame < 280
      ? 0
      : frame < 324
      ? clamp(frame, 280, 286, 0, 1)
      : clamp(frame, 324, 330, 1, 0);

  // Phantom: fade in 330-336 (starts right after TMA is gone), snap out 420-426
  const phantomOpacity =
    frame < 330
      ? 0
      : frame < 420
      ? clamp(frame, 330, 336, 0, 1)
      : clamp(frame, 420, 426, 1, 0);

  // Submitting: fade in 426-432 (after Phantom gone), snap out 468-474
  const submittingOpacity =
    frame < 426
      ? 0
      : frame < 468
      ? clamp(frame, 426, 432, 0, 1)
      : clamp(frame, 468, 474, 1, 0);

  // Success: fade in 474-480, snap out 558-564
  const successOpacity =
    frame < 474
      ? 0
      : frame < 558
      ? clamp(frame, 474, 480, 0, 1)
      : clamp(frame, 558, 564, 1, 0);

  const chatConfirmOpacity =
    frame < 558 ? 0 : clamp(frame, 564, 570, 0, 1);

  return (
    <div style={{position: 'relative', width: VIEWPORT_W, height: VIEWPORT_H, overflow: 'hidden'}}>
      {/* Always-on lavender background */}
      <LavenderBg />

      {/* Scene 1: Hook text (no phone) */}
      {showHook && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: clamp(frame, 50, 62, 1, 0),
          }}
        >
          <Hook frame={frame} />
        </div>
      )}

      {/* Phone frame — present for all scenes 2-8 */}
      {showPhone && (
        <PhoneFrame opacity={phoneOpacity}>
          {/* Layer 1: Telegram chat (scenes 2 & 7) */}
          {(showTelegramChat || showChatConfirm) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: showChatConfirm ? chatConfirmOpacity : chatOpacity,
              }}
            >
              <TelegramChatContent frame={frame} showConfirm={showChatConfirm} />
            </div>
          )}

          {/* Layer 2: TMA Connect (scene 3) */}
          {showTmaConnect && (
            <div style={{position: 'absolute', inset: 0, opacity: tmaConnectOpacity}}>
              <TmaScreenContent frame={frame} />
            </div>
          )}

          {/* Layer 3: TMA Wallet Connected (scene 3b crossfade — fades in at 280, fades out at 342) */}
          {showTmaConnected && tmaConnectedOpacity > 0 && (
            <div style={{position: 'absolute', inset: 0, opacity: tmaConnectedOpacity}}>
              <TmaScreenContent frame={frame} showWallet />
            </div>
          )}

          {/* Layer 4: Phantom (scene 4) */}
          {showPhantom && (
            <div style={{position: 'absolute', inset: 0, opacity: phantomOpacity}}>
              <PhantomScreenContent frame={frame} />
            </div>
          )}

          {/* Layer 5: Submitting (scene 5) */}
          {showSubmitting && (
            <div style={{position: 'absolute', inset: 0, opacity: submittingOpacity}}>
              <TmaScreenContent frame={frame} showWallet showSubmitting />
            </div>
          )}

          {/* Layer 6: Success (scene 6) */}
          {showSuccess && (
            <div style={{position: 'absolute', inset: 0, opacity: successOpacity}}>
              <TmaScreenContent frame={frame} showWallet showSuccess />
            </div>
          )}
        </PhoneFrame>
      )}

      {/* Scene 8: End Card */}
      {showEndCard && <SwapEndCard frame={frame} />}

      {/* Audio */}
      <Audio src={staticFile('music/bg-music.mp3')} volume={0.4} startFrom={0} />

      {/* Film grain — always on top */}
      <FilmGrain frame={frame} />
    </div>
  );
};
