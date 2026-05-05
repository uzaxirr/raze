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
// Telegram chat: user bubble override — Telegram green #EEFFDE, dark text
// ---------------------------------------------------------------------------

/** Green Telegram-style user bubble. Replaces the purple one from Bubbles.tsx */
const GreenUserBubble: React.FC<{
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
          background: '#EEFFDE',
          color: '#111',
          borderRadius: '18px 18px 4px 18px',
          padding: '9px 13px 6px',
          fontSize: 14,
          fontFamily: typography.stack,
          maxWidth: '78%',
          lineHeight: 1.4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
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
              color: 'rgba(0,0,0,0.4)',
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

// Sign transaction button bubble
const SignBubble: React.FC<{frame: number; startFrame: number}> = ({frame, startFrame}) => {
  if (frame < startFrame) return null;
  const op = clamp(frame, startFrame, startFrame + 10, 0, 1);
  const scale = clamp(frame, startFrame, startFrame + 12, 0.88, 1);
  return (
    <div style={{display: 'flex', justifyContent: 'center', padding: '4px 12px', marginBottom: 6}}>
      <div
        style={{
          opacity: op,
          transform: `scale(${scale})`,
          background: colors.purple,
          borderRadius: 14,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: typography.stack,
          boxShadow: `0 0 20px ${colors.purpleGlow}`,
          letterSpacing: '0.01em',
        }}
      >
        🔐 Sign Transaction
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
          background: '#F0EDFF',
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
          background: '#FFFFFF',
          color: colors.textPrimary,
          borderRadius: '18px 18px 18px 4px',
          padding: '9px 13px 6px',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: typography.stack,
          maxWidth: '78%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transform: `scale(${sc})`,
          transformOrigin: 'bottom left',
        }}
      >
        <div>✅ Swap confirmed!</div>
        <div>1.0 USDC → 0.011410901 SOL</div>
        <div style={{color: colors.purple, textDecoration: 'underline'}}>View on Solscan</div>
        <div style={{marginTop: 2, fontSize: 10, color: 'rgba(0,0,0,0.3)'}}>9:41</div>
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
      <GreenUserBubble
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

// TMA top bar inside the phone screen
const TmaTopBar: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: phone.STATUS_H,
      left: 0,
      right: 0,
      height: phone.HEADER_H,
      background: 'rgba(255,255,255,0.85)',
      borderBottom: `1px solid ${colors.divider}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* Back arrow */}
    <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
      <path d="M8 2L2 9L8 16" stroke={colors.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 1}}>
      <span style={{fontSize: 13, fontWeight: 600, color: '#111'}}>Raze — Sign Transaction</span>
      <span style={{fontSize: 10, color: '#aaa'}}>raze.fun</span>
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

  // Bouncing dots
  const dot1 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2) * 6 : 0;
  const dot2 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.45) * 6 : 0;
  const dot3 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.9) * 6 : 0;

  // Checkmark spring
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

      {/* Scrollable TMA body */}
      <div
        style={{
          position: 'absolute',
          top: phone.TOTAL_HEADER,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, #F8F6FF 0%, #EDE8FF 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '18px 16px 20px',
          overflowY: 'hidden',
        }}
      >
        {/* Timer circle */}
        <div style={{position: 'relative', width: '100%'}}>
          <TimerCircle />
        </div>

        {/* Mascot + title */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            background: '#F0EDFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          <img src={mascotSrc} alt="" style={{width: '90%', height: '90%', objectFit: 'contain'}} />
        </div>
        <div style={{fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2, fontFamily: typography.stack}}>raze</div>
        <div style={{fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6, fontFamily: typography.stack}}>Swap</div>
        <div
          style={{
            background: '#14F195',
            color: '#000',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: 14,
            fontFamily: typography.stack,
          }}
        >
          MAINNET
        </div>

        {/* Swap box */}
        <div
          style={{
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{flex: 1, textAlign: 'left'}}>
            <div style={{fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontFamily: typography.stack}}>YOU PAY</div>
            <div style={{fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1, fontFamily: typography.stack}}>1</div>
            <div style={{fontSize: 10, color: '#555', marginTop: 2, fontFamily: typography.stack}}>USDG</div>
          </div>
          <div style={{fontSize: 16, color: colors.purple, fontWeight: 700}}>→</div>
          <div style={{flex: 1, textAlign: 'right'}}>
            <div style={{fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, fontFamily: typography.stack}}>YOU GET</div>
            <div style={{fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1, fontFamily: typography.stack}}>
              {showSubmitting || showSuccess ? '0.01141' : '~'}
            </div>
            <div style={{fontSize: 10, color: '#555', marginTop: 2, fontFamily: typography.stack}}>SOL</div>
          </div>
        </div>

        {/* Tx address */}
        <div
          style={{
            fontSize: 10,
            color: '#999',
            fontFamily: 'monospace',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          transaction for: D4M5c6...YgpJ
        </div>

        {/* Connected wallet indicator */}
        {showWallet && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#F0FFF8',
              borderRadius: 8,
              padding: '5px 10px',
              marginBottom: 8,
              fontSize: 10,
              color: '#333',
              fontFamily: 'monospace',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{width: 7, height: 7, borderRadius: 4, background: '#14F195', flexShrink: 0}} />
            <span>GfM3...xQ7z connected</span>
          </div>
        )}

        {/* Submitting state */}
        {showSubmitting && !showSuccess && (
          <div style={{textAlign: 'center', marginBottom: 8}}>
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

        {/* Success state */}
        {showSuccess && (
          <div style={{textAlign: 'center', marginBottom: 8, opacity: checkOp}}>
            <div
              style={{
                fontSize: 44,
                color: '#14F195',
                transform: `scale(${checkScale})`,
                display: 'inline-block',
                marginBottom: 4,
              }}
            >
              ✓
            </div>
            <div style={{fontSize: 14, fontWeight: 700, color: '#14F195', marginBottom: 4, fontFamily: typography.stack}}>
              transaction sent
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                color: '#777',
                marginBottom: 8,
                opacity: txHashOp,
              }}
            >
              BZQs2Uez1v...QmyZz2
            </div>
            <div
              style={{
                border: `1px solid ${colors.purple}`,
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11,
                color: colors.purple,
                display: 'inline-block',
                marginBottom: 6,
                opacity: solscanOp,
                fontFamily: typography.stack,
              }}
            >
              view on solscan
            </div>
            <div style={{fontSize: 11, color: '#aaa', opacity: backOp, fontFamily: typography.stack}}>
              back to telegram
            </div>
          </div>
        )}

        {/* Buttons — connect state */}
        {!showWallet && !showSubmitting && !showSuccess && (
          <div style={{display: 'flex', gap: 8, marginBottom: 10, width: '100%', boxSizing: 'border-box'}}>
            <div
              style={{
                flex: 1,
                border: `1.5px solid #ddd`,
                borderRadius: 10,
                background: 'transparent',
                padding: '8px 0',
                fontSize: 12,
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
                border: `1.5px solid #ddd`,
                borderRadius: 10,
                background: 'transparent',
                padding: '8px 0',
                fontSize: 12,
                color: '#555',
                textAlign: 'center',
                fontFamily: typography.stack,
              }}
            >
              connect wallet
            </div>
          </div>
        )}

        {/* Primary CTA button */}
        {!showSubmitting && !showSuccess && (
          <div
            style={{
              background: colors.purple,
              borderRadius: 12,
              padding: '11px 0',
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: typography.stack,
              boxShadow: showWallet
                ? `0 0 ${glowPx}px ${colors.purpleGlow}, 0 0 ${glowPx * 2}px rgba(153,69,255,0.2)`
                : 'none',
            }}
          >
            {showWallet ? 'sign & send' : 'Connect Wallet'}
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop: 10, fontSize: 10, color: '#bbb', fontFamily: typography.stack, textAlign: 'center'}}>
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

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 20px 20px',
        fontFamily: typography.stack,
        overflowY: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: '#F0EDFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img src={mascotSrc} alt="" style={{width: '90%', height: '90%', objectFit: 'contain'}} />
        </div>
        <span style={{fontSize: 13, color: '#fff', fontWeight: 600}}>raze.fun</span>
      </div>

      <div style={{fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2}}>
        Confirm transaction
      </div>
      <div style={{fontSize: 11, color: '#888', marginBottom: 10}}>
        Balance changes are estimated...
      </div>

      {/* Warning */}
      <div
        style={{
          background: 'rgba(255, 180, 0, 0.12)',
          border: '1px solid rgba(255, 180, 0, 0.4)',
          borderRadius: 10,
          padding: '7px 10px',
          fontSize: 11,
          color: '#FFB400',
          marginBottom: 12,
          lineHeight: 1.4,
        }}
      >
        This domain is new. Only proceed if you trust this site.
      </div>

      {/* Token rows */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              background: '#2775CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{fontSize: 10, fontWeight: 700, color: '#fff'}}>$</span>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 12, color: '#fff', fontWeight: 500}}>USD Coin</div>
            <div style={{fontSize: 10, color: '#888'}}>USDC</div>
          </div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#CC4444'}}>-1 USDC</div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              background: 'linear-gradient(135deg, #9945FF, #14F195)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{fontSize: 10, fontWeight: 700, color: '#fff'}}>◎</span>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 12, color: '#fff', fontWeight: 500}}>Solana</div>
            <div style={{fontSize: 10, color: '#888'}}>SOL</div>
          </div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#14F195'}}>+0.011414 SOL</div>
        </div>
      </div>

      {/* Details */}
      {[
        {label: 'Account', value: 'GfM3...xQ7z'},
        {label: 'Network', value: 'Mainnet'},
        {label: 'Network Fee', value: '~0.000005 SOL'},
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#888',
            marginBottom: 5,
          }}
        >
          <span>{row.label}</span>
          <span style={{color: '#ccc'}}>{row.value}</span>
        </div>
      ))}

      {/* Buttons */}
      <div style={{display: 'flex', gap: 8, marginTop: 14}}>
        <div
          style={{
            flex: 1,
            background: '#3a3a3a',
            borderRadius: 10,
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 13,
            color: '#ccc',
            fontWeight: 600,
          }}
        >
          Close
        </div>
        <div
          style={{
            flex: 1,
            background: colors.purple,
            borderRadius: 10,
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 13,
            color: '#fff',
            fontWeight: 700,
            transform: `scale(${confirmTapScale})`,
          }}
        >
          Confirm
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
  const showTmaConnect = frame >= 210 && frame < 330;
  const showTmaConnected = frame >= 280 && frame < 342; // wallet connected crossfade
  const showPhantom = frame >= 330 && frame < 440;
  const showSubmitting = frame >= 420 && frame < 492;
  const showSuccess = frame >= 480 && frame < 575;
  const showChatConfirm = frame >= 558 && frame < 665;
  const showEndCard = frame >= 660;

  // Phone fade-in (scenes 2+)
  const phoneOpacity = clamp(frame, 55, 72, 0, 1);

  // Cross-fade opacities — each layer fades in then fades out, no two at full opacity simultaneously
  const chatOpacity =
    frame < 60 ? 0 : frame < 210 ? clamp(frame, 60, 72, 0, 1) : clamp(frame, 210, 222, 1, 0);

  const tmaConnectOpacity =
    frame < 210
      ? 0
      : frame < 318
      ? clamp(frame, 210, 222, 0, 1)
      : clamp(frame, 318, 330, 1, 0);

  const tmaConnectedOpacity =
    frame < 280
      ? 0
      : frame < 330
      ? clamp(frame, 280, 292, 0, 1)
      : clamp(frame, 330, 342, 1, 0);

  const phantomOpacity =
    frame < 330
      ? 0
      : frame < 420
      ? clamp(frame, 330, 342, 0, 1)
      : clamp(frame, 420, 432, 1, 0);

  const submittingOpacity =
    frame < 420
      ? 0
      : frame < 468
      ? clamp(frame, 432, 444, 0, 1)
      : clamp(frame, 468, 480, 1, 0);

  const successOpacity =
    frame < 480
      ? 0
      : frame < 558
      ? clamp(frame, 480, 492, 0, 1)
      : clamp(frame, 558, 570, 1, 0);

  const chatConfirmOpacity =
    frame < 558 ? 0 : clamp(frame, 558, 570, 0, 1);

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
