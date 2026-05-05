import {Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BackgroundScene} from './BackgroundScene';
import {FilmGrain} from './FilmGrain';
import {UserBubble, RazeBubble} from './Bubbles';
import {StatusBar, ChatHeader, Composer} from './PhoneChrome';
import {colors, mascotSrc, phone, typography} from './tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(frame: number, a: number, b: number, from: number, to: number) {
  return interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function spring(frame: number, start: number, duration: number) {
  const t = Math.min(1, Math.max(0, (frame - start) / duration));
  return t < 1
    ? 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI * 1.5) * 0.15 * (1 - t)
    : 1;
}

// ---------------------------------------------------------------------------
// Scene 1 — HOOK  (frames 0-60)
// ---------------------------------------------------------------------------

const Hook: React.FC<{frame: number}> = ({frame}) => {
  const lines: {text: string; color: string; start: number}[] = [
    {text: 'your keys.', color: '#ffffff', start: 0},
    {text: 'your wallet.', color: '#ffffff', start: 15},
    {text: 'one message.', color: colors.purple, start: 30},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0D0B14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontFamily: '"Space Grotesk", ' + typography.stack,
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
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — TELEGRAM CHAT  (frames 60-210)
// ---------------------------------------------------------------------------

const PHONE_SCALE = 1920 / phone.H; // ~2.274 — fills height
const PHONE_SCALE_CHAT = 1.78;

const PhoneWrap: React.FC<{children: React.ReactNode; scale?: number}> = ({
  children,
  scale = PHONE_SCALE_CHAT,
}) => (
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
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        borderRadius: phone.CORNER_OUTER,
        background: colors.phoneFrame,
        boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Screen area */}
      <div
        style={{
          position: 'absolute',
          inset: phone.BEZEL,
          borderRadius: phone.CORNER_SCREEN,
          background: colors.chatBg,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

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
          background: '#2A2540',
          borderRadius: 14,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: typography.stack,
          boxShadow: '0 0 24px rgba(153,69,255,0.35)',
          letterSpacing: '0.01em',
        }}
      >
        🔐 Sign Transaction
      </div>
    </div>
  );
};

const TelegramChat: React.FC<{frame: number}> = ({frame}) => {
  const chatFrame = frame - 60;

  return (
    <PhoneWrap>
      <StatusBar opacity={1} />
      <ChatHeader mascotSrc={mascotSrc} />

      {/* Chat messages */}
      <div
        style={{
          position: 'absolute',
          top: phone.TOTAL_HEADER,
          bottom: phone.COMPOSER_H,
          left: 0,
          right: 0,
          overflowY: 'hidden',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <UserBubble
          text="swap 1 usdc to sol"
          startFrame={70}
          cpf={0.9}
          timestamp="9:41"
          frame={frame}
        />
        <RazeBubble
          lines={[
            {text: '1 USDC → 0.0114 SOL via jupiter.', frame: 110},
            {text: 'ready to sign.', frame: 122},
          ]}
          mascotSrc={mascotSrc}
          timestamp="9:41"
          frame={frame}
        />
        <SignBubble frame={frame} startFrame={150} />
      </div>

      <Composer />
    </PhoneWrap>
  );
};

// ---------------------------------------------------------------------------
// Slide transition helper
// ---------------------------------------------------------------------------

function slideX(frame: number, start: number, end: number, fromPx: number, toPx: number) {
  return clamp(frame, start, end, fromPx, toPx);
}

// ---------------------------------------------------------------------------
// Scene 3 — TMA SIGNING PAGE — CONNECT  (frames 210-300)
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

const SwapDetailsBox: React.FC<{showExact?: boolean}> = ({showExact = false}) => (
  <div
    style={{
      background: '#F8F6FF',
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    }}
  >
    {/* Pay side */}
    <div style={{flex: 1, textAlign: 'left'}}>
      <div style={{fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2}}>
        YOU PAY
      </div>
      <div style={{fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1}}>1</div>
      <div style={{fontSize: 11, color: '#555', marginTop: 2}}>USDG</div>
    </div>
    {/* Arrow */}
    <div style={{fontSize: 18, color: colors.purple, fontWeight: 700}}>→</div>
    {/* Get side */}
    <div style={{flex: 1, textAlign: 'right'}}>
      <div style={{fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2}}>
        YOU GET
      </div>
      <div style={{fontSize: 24, fontWeight: 700, color: '#111', lineHeight: 1}}>
        {showExact ? '0.01141' : '~'}
      </div>
      <div style={{fontSize: 11, color: '#555', marginTop: 2}}>SOL</div>
    </div>
  </div>
);

const TmaCard: React.FC<{
  frame: number;
  showWallet?: boolean;
  showSubmitting?: boolean;
  showSuccess?: boolean;
}> = ({frame, showWallet = false, showSubmitting = false, showSuccess = false}) => {
  // Pulse glow on "sign & send" button
  const glowPulse = showWallet
    ? (Math.sin(((frame - 300) / 45) * Math.PI * 2) + 1) / 2
    : 0;
  const glowPx = glowPulse * 12;

  // Bounce dots for submitting
  const dot1 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2) * 8 : 0;
  const dot2 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.45) * 8 : 0;
  const dot3 = showSubmitting ? Math.sin(((frame - 480) / 9) * Math.PI * 2 + Math.PI * 0.9) * 8 : 0;

  // Checkmark spring
  const checkScale = showSuccess ? spring(frame, 540, 15) * 1.1 : 0;
  const finalCheck = showSuccess ? (checkScale > 1.05 ? clamp(frame, 555, 560, 1.1, 1) : checkScale) : 0;
  const checkOp = showSuccess ? clamp(frame, 540, 548, 0, 1) : 0;
  const txHashOp = showSuccess ? clamp(frame, 560, 572, 0, 1) : 0;
  const solscanOp = showSuccess ? clamp(frame, 572, 584, 0, 1) : 0;
  const backOp = showSuccess ? clamp(frame, 584, 596, 0, 1) : 0;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '20px 18px 18px',
        width: 300,
        position: 'relative',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        fontFamily: typography.stack,
      }}
    >
      <TimerCircle />

      {/* Header */}
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 14}}>
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
        <div style={{fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4}}>raze</div>
        <div style={{fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 6}}>Swap</div>
        {/* Mainnet badge */}
        <div
          style={{
            background: '#14F195',
            color: '#000',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          MAINNET
        </div>
      </div>

      {/* Swap details */}
      <SwapDetailsBox showExact={showSubmitting || showSuccess} />

      {/* Tx address */}
      <div
        style={{
          fontSize: 11,
          color: '#999',
          fontFamily: 'monospace',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        transaction for: D4M5c6...YgpJ
      </div>

      {/* Wallet indicator (scene 4+) */}
      {showWallet && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F0FFF8',
            borderRadius: 8,
            padding: '6px 10px',
            marginBottom: 10,
            fontSize: 11,
            color: '#333',
            fontFamily: 'monospace',
          }}
        >
          <div style={{width: 8, height: 8, borderRadius: 4, background: '#14F195', flexShrink: 0}} />
          <span>GfM3...xQ7z connected</span>
        </div>
      )}

      {/* Submitting state */}
      {showSubmitting && !showSuccess && (
        <div style={{textAlign: 'center', marginBottom: 10}}>
          <div style={{fontSize: 12, color: '#777', marginBottom: 8}}>
            price impact: -0.019%
          </div>
          <div style={{fontSize: 13, color: '#555', marginBottom: 10}}>
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
        <div
          style={{
            textAlign: 'center',
            marginBottom: 10,
            opacity: checkOp,
          }}
        >
          <div
            style={{
              fontSize: 52,
              color: '#14F195',
              transform: `scale(${finalCheck})`,
              display: 'inline-block',
              marginBottom: 6,
            }}
          >
            ✓
          </div>
          <div style={{fontSize: 16, fontWeight: 700, color: '#14F195', marginBottom: 6}}>
            transaction sent
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#777',
              marginBottom: 10,
              opacity: txHashOp,
            }}
          >
            BZQs2Uez1v...QmyZz2
          </div>
          <div
            style={{
              border: `1px solid ${colors.purple}`,
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              color: colors.purple,
              display: 'inline-block',
              marginBottom: 8,
              opacity: solscanOp,
            }}
          >
            view on solscan
          </div>
          <div style={{fontSize: 12, color: '#aaa', opacity: backOp}}>back to telegram</div>
        </div>
      )}

      {/* Buttons — connect state */}
      {!showWallet && !showSubmitting && !showSuccess && (
        <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
          <button
            style={{
              flex: 1,
              border: `1.5px solid #ddd`,
              borderRadius: 10,
              background: 'transparent',
              padding: '9px 0',
              fontSize: 13,
              color: '#555',
              cursor: 'pointer',
              fontFamily: typography.stack,
            }}
          >
            scan QR
          </button>
          <button
            style={{
              flex: 1,
              border: `1.5px solid #ddd`,
              borderRadius: 10,
              background: 'transparent',
              padding: '9px 0',
              fontSize: 13,
              color: '#555',
              cursor: 'pointer',
              fontFamily: typography.stack,
            }}
          >
            connect wallet
          </button>
        </div>
      )}

      {/* Primary CTA */}
      {!showSubmitting && !showSuccess && (
        <div
          style={{
            background: colors.purple,
            borderRadius: 12,
            padding: '13px 0',
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            boxShadow: showWallet
              ? `0 0 ${glowPx}px ${colors.purpleGlow}, 0 0 ${glowPx * 2}px rgba(153,69,255,0.2)`
              : 'none',
          }}
        >
          {showWallet ? 'sign & send' : 'Connect Wallet'}
        </div>
      )}

      {/* Footer */}
      <div style={{textAlign: 'center', marginTop: 12, fontSize: 11, color: '#bbb'}}>
        raze.fun · @raze_aii
      </div>
    </div>
  );
};

const TmaPageConnect: React.FC<{frame: number; slideOffsetX?: number}> = ({
  frame,
  slideOffsetX = 0,
}) => {
  const op = clamp(frame, 210, 222, 0, 1);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #F0EDFF 0%, #E4DCFF 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        transform: `translateX(${slideOffsetX}px)`,
      }}
    >
      <TmaCard frame={frame} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 4 — WALLET CONNECTED  (frames 300-390)
// ---------------------------------------------------------------------------

const TmaPageConnected: React.FC<{frame: number; slideOffsetX?: number}> = ({
  frame,
  slideOffsetX = 0,
}) => {
  const op = clamp(frame, 300, 312, 0, 1);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #F0EDFF 0%, #E4DCFF 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        transform: `translateX(${slideOffsetX}px)`,
      }}
    >
      <TmaCard frame={frame} showWallet />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — PHANTOM CONFIRMATION  (frames 390-480)
// ---------------------------------------------------------------------------

const PhantomCard: React.FC<{frame: number}> = ({frame}) => {
  const confirmTap = clamp(frame, 460, 468, 1, 0.95);
  const confirmScale = frame > 468 ? clamp(frame, 468, 476, 0.95, 1) : confirmTap;
  const finalScale = frame > 460 ? confirmScale : 1;

  return (
    <div
      style={{
        background: '#2a2a2a',
        borderRadius: 20,
        padding: '20px 18px 18px',
        width: 300,
        fontFamily: typography.stack,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14}}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: '#F0EDFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img src={mascotSrc} alt="" style={{width: '90%', height: '90%', objectFit: 'contain'}} />
        </div>
        <span style={{fontSize: 14, color: '#fff', fontWeight: 600}}>raze.fun</span>
      </div>

      <div style={{fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4}}>
        Confirm transaction
      </div>
      <div style={{fontSize: 12, color: '#888', marginBottom: 12}}>
        Balance changes are estimated...
      </div>

      {/* Warning box */}
      <div
        style={{
          background: 'rgba(255, 180, 0, 0.12)',
          border: '1px solid rgba(255, 180, 0, 0.4)',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 12,
          color: '#FFB400',
          marginBottom: 14,
          lineHeight: 1.4,
        }}
      >
        This domain is new. Only proceed if you trust this site.
      </div>

      {/* Token rows */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14}}>
        {/* USDC row */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: '#2775CA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{fontSize: 11, fontWeight: 700, color: '#fff'}}>$</span>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 13, color: '#fff', fontWeight: 500}}>USD Coin</div>
            <div style={{fontSize: 11, color: '#888'}}>USDC</div>
          </div>
          <div style={{fontSize: 14, fontWeight: 700, color: '#CC4444'}}>-1 USDC</div>
        </div>

        {/* SOL row */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #9945FF, #14F195)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{fontSize: 11, fontWeight: 700, color: '#fff'}}>◎</span>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 13, color: '#fff', fontWeight: 500}}>Solana</div>
            <div style={{fontSize: 11, color: '#888'}}>SOL</div>
          </div>
          <div style={{fontSize: 14, fontWeight: 700, color: '#14F195'}}>+0.011414 SOL</div>
        </div>
      </div>

      {/* Details rows */}
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
            fontSize: 12,
            color: '#888',
            marginBottom: 6,
          }}
        >
          <span>{row.label}</span>
          <span style={{color: '#ccc'}}>{row.value}</span>
        </div>
      ))}

      {/* Buttons */}
      <div style={{display: 'flex', gap: 10, marginTop: 14}}>
        <div
          style={{
            flex: 1,
            background: '#3a3a3a',
            borderRadius: 10,
            padding: '11px 0',
            textAlign: 'center',
            fontSize: 14,
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
            padding: '11px 0',
            textAlign: 'center',
            fontSize: 14,
            color: '#fff',
            fontWeight: 700,
            transform: `scale(${finalScale})`,
          }}
        >
          Confirm
        </div>
      </div>
    </div>
  );
};

const PhantomScene: React.FC<{frame: number; slideOffsetX?: number}> = ({
  frame,
  slideOffsetX = 0,
}) => {
  const op = clamp(frame, 390, 402, 0, 1);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        transform: `translateX(${slideOffsetX}px)`,
      }}
    >
      <PhantomCard frame={frame} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — SUBMITTING  (frames 480-540)
// ---------------------------------------------------------------------------

const TmaPageSubmitting: React.FC<{frame: number; slideOffsetX?: number}> = ({
  frame,
  slideOffsetX = 0,
}) => {
  const op = clamp(frame, 480, 492, 0, 1);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #F0EDFF 0%, #E4DCFF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: op,
        transform: `translateX(${slideOffsetX}px)`,
      }}
    >
      <TmaCard frame={frame} showWallet showSubmitting />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 7 — TRANSACTION SENT  (frames 540-630)
// ---------------------------------------------------------------------------

const TmaPageSuccess: React.FC<{frame: number; slideOffsetX?: number}> = ({
  frame,
  slideOffsetX = 0,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #F0EDFF 0%, #E4DCFF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateX(${slideOffsetX}px)`,
      }}
    >
      <TmaCard frame={frame} showWallet showSuccess />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 8 — BACK TO TELEGRAM  (frames 630-690)
// ---------------------------------------------------------------------------

const ConfirmBubble: React.FC<{frame: number; startFrame: number}> = ({frame, startFrame}) => {
  if (frame < startFrame) return null;
  const op = clamp(frame, startFrame, startFrame + 10, 0, 1);
  const s1 = clamp(frame, startFrame, startFrame + 8, 0.9, 1.03);
  const s2 = clamp(frame, startFrame + 8, startFrame + 14, 1.03, 1);
  const sc = frame < startFrame + 8 ? s1 : s2;

  return (
    <div style={{display: 'flex', gap: 6, padding: '0 12px', marginBottom: 6, alignItems: 'flex-end', opacity: op}}>
      <div
        style={{
          width: 32, height: 32, borderRadius: 16,
          background: '#F0EDFF', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <img src={mascotSrc} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
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
          transform: `scale(${sc})`,
          transformOrigin: 'bottom left',
        }}
      >
        <div>✅ Swap confirmed!</div>
        <div>1.0 USDC → 0.011410901 SOL</div>
        <div style={{color: colors.purple, textDecoration: 'underline'}}>View on Solscan</div>
        <div style={{marginTop: 2, fontSize: 10, color: colors.bubbleBotMeta}}>9:41</div>
      </div>
    </div>
  );
};

const TelegramChatConfirmed: React.FC<{frame: number}> = ({frame}) => {
  return (
    <PhoneWrap>
      <StatusBar opacity={1} />
      <ChatHeader mascotSrc={mascotSrc} />
      <div
        style={{
          position: 'absolute',
          top: phone.TOTAL_HEADER,
          bottom: phone.COMPOSER_H,
          left: 0,
          right: 0,
          overflowY: 'hidden',
          paddingTop: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <UserBubble text="swap 1 usdc to sol" startFrame={-999} cpf={99} timestamp="9:41" frame={frame} />
        <RazeBubble
          lines={[
            {text: '1 USDC → 0.0114 SOL via jupiter.', frame: -999},
            {text: 'ready to sign.', frame: -999},
          ]}
          mascotSrc={mascotSrc}
          timestamp="9:41"
          frame={frame}
        />
        <SignBubble frame={frame} startFrame={-999} />
        <ConfirmBubble frame={frame} startFrame={630} />
      </div>
      <Composer />
    </PhoneWrap>
  );
};

// ---------------------------------------------------------------------------
// Scene 9 — END CARD  (frames 690-750)
// ---------------------------------------------------------------------------

const SwapEndCard: React.FC<{frame: number}> = ({frame}) => {
  const overlayOp = clamp(frame, 690, 708, 0, 0.88);
  const line1Op = clamp(frame, 700, 718, 0, 1);
  const line1Y = clamp(frame, 700, 718, 16, 0);
  const razeOp = clamp(frame, 714, 732, 0, 1);
  const razeY = clamp(frame, 714, 732, 20, 0);
  const glowT = clamp(frame, 720, 750, 0, 1);
  const taglineOp = clamp(frame, 726, 744, 0, 1);
  const taglineY = clamp(frame, 726, 744, 12, 0);

  const springT = spring(frame, 696, 25);
  const mascotOp = clamp(frame, 690, 706, 0, 1);

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOp})`}} />
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
            transform: `translateY(${(1 - springT) * 100}px) scale(${0.9 + springT * 0.1})`,
            filter: `drop-shadow(0 0 24px rgba(153,69,255,${0.7 * glowT}))`,
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            opacity: line1Op,
            transform: `translateY(${line1Y}px)`,
            textAlign: 'center',
            padding: '0 40px',
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
            textShadow: `0 0 ${32 * glowT}px rgba(153,69,255,${0.6 * glowT}), 0 0 ${60 * glowT}px rgba(153,69,255,${0.3 * glowT})`,
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

  // Slide transition: scenes slide left-to-right
  // Scene 2 (chat) → Scene 3 (TMA connect): frame 205-215
  const chatSlideX = frame >= 205 ? clamp(frame, 205, 218, 0, -1080) : 0;
  const tmaConnectIn = frame >= 205 ? clamp(frame, 205, 218, 1080, 0) : 1080;

  // Scene 3 (TMA connect) → Scene 4 (wallet connected): crossfade opacity-only
  // (handled by opacity in each scene component)

  // Scene 4 (wallet connected) → Scene 5 (phantom): frame 385-398
  const tmaConnectedOut = frame >= 385 ? clamp(frame, 385, 398, 0, -1080) : 0;
  const phantomIn = frame >= 385 ? clamp(frame, 385, 398, 1080, 0) : 1080;

  // Scene 5 (phantom) → Scene 6 (submitting): frame 478-490
  const phantomOut = frame >= 478 ? clamp(frame, 478, 490, 0, -1080) : 0;
  const submittingIn = frame >= 478 ? clamp(frame, 478, 490, 1080, 0) : 1080;

  // Scene 7-8 cross: submitting transitions into success in-place (fade)
  // Scene 8 (success) → Scene 9 (back to telegram): frame 628-640
  const tmaOut = frame >= 628 ? clamp(frame, 628, 640, 0, -1080) : 0;
  const chatConfirmIn = frame >= 628 ? clamp(frame, 628, 640, 1080, 0) : 1080;

  const showHook = frame < 60;
  const showChat = frame >= 60 && frame < 210;
  const showTmaConnect = frame >= 205 && frame < 300;
  const showTmaConnected = frame >= 295 && frame < 390;
  const showPhantom = frame >= 385 && frame < 480;
  const showSubmitting = frame >= 478 && frame < 540;
  const showSuccess = frame >= 540 && frame < 630;
  const showChatConfirm = frame >= 628 && frame < 695;
  const showEndCard = frame >= 690;

  return (
    <div style={{position: 'relative', width: 1080, height: 1920, overflow: 'hidden', background: '#0D0B14'}}>
      {/* Background — always present in dark scenes */}
      {!showTmaConnect && !showTmaConnected && !showPhantom && !showSubmitting && !showSuccess && (
        <BackgroundScene frame={frame} ctaDark={0} />
      )}

      {/* Scene 1: Hook */}
      {showHook && <Hook frame={frame} />}

      {/* Scene 2: Telegram chat */}
      {showChat && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${chatSlideX}px)`,
          }}
        >
          <BackgroundScene frame={frame} ctaDark={0} />
          <TelegramChat frame={frame} />
        </div>
      )}

      {/* Scene 3: TMA connect */}
      {showTmaConnect && (
        <TmaPageConnect frame={frame} slideOffsetX={tmaConnectIn} />
      )}

      {/* Scene 4: Wallet connected */}
      {showTmaConnected && (
        <TmaPageConnected frame={frame} slideOffsetX={tmaConnectedOut} />
      )}

      {/* Scene 5: Phantom */}
      {showPhantom && (
        <PhantomScene frame={frame} slideOffsetX={phantomIn} />
      )}

      {/* Scene 6: Submitting */}
      {showSubmitting && (
        <TmaPageSubmitting frame={frame} slideOffsetX={submittingIn} />
      )}

      {/* Scene 7: Success */}
      {showSuccess && <TmaPageSuccess frame={frame} />}

      {/* Scene 8: Back to Telegram */}
      {showChatConfirm && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateX(${chatConfirmIn}px)`,
          }}
        >
          <BackgroundScene frame={frame} ctaDark={0} />
          <TelegramChatConfirmed frame={frame} />
        </div>
      )}

      {/* Scene 9: End card */}
      {showEndCard && <SwapEndCard frame={frame} />}

      {/* Audio */}
      <Audio src={staticFile('music/bg-music.mp3')} volume={0.4} startFrom={0} />

      {/* Film grain — always on top */}
      <FilmGrain frame={frame} />
    </div>
  );
};
