import {interpolate, Easing} from 'remotion';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/* ────────────────────────────────────────────────────────
 *  X dark theme tokens
 * ──────────────────────────────────────────────────────── */
const tw = {
  bg: '#000000',
  border: '#2f3336',
  textPrimary: '#e7e9ea',
  textSecondary: '#71767b',
  textLink: '#1d9bf0',
  accent: '#1d9bf0',
  sidebarBg: '#000000',
  font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const SIDEBAR_W = 220;

/* ────────────────────────────────────────────────────────
 *  SVG Icons
 * ──────────────────────────────────────────────────────── */
const XLogo: React.FC = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill={tw.textPrimary}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const HomeIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill={tw.textPrimary}>
    <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913h5.953a.93.93 0 00.929-.913v-7.075h3.378v7.075c0 .502.418.913.929.913h5.953a.93.93 0 00.929-.913V7.903c0-.301-.149-.584-.409-.757z" />
  </svg>
);

const ExploreIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tw.textPrimary} strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const NotifIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tw.textPrimary} strokeWidth={2}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const MessagesIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tw.textPrimary} strokeWidth={2}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

const GrokIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill={tw.textPrimary}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const PremiumIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tw.textPrimary} strokeWidth={2}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ProfileIcon: React.FC = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={tw.textPrimary} strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const BackArrow: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill={tw.textPrimary}>
    <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
  </svg>
);

const VerifiedBadge: React.FC<{size?: number}> = ({size = 18}) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path d="M20.396 11c.869-.756.47-2.16-.635-2.264a1.474 1.474 0 01-1.266-1.266c-.105-1.106-1.507-1.504-2.264-.635a1.474 1.474 0 01-1.79.272c-.968-.553-2.197.15-1.985 1.252a1.474 1.474 0 01-.764 1.61c-.968.553-.812 2.063.272 2.39a1.474 1.474 0 011.084 1.381c.044 1.113 1.435 1.642 2.244.853a1.474 1.474 0 011.79-.272c.968.553 2.197-.15 1.985-1.252a1.474 1.474 0 01.764-1.61c.968-.553.812-2.063-.272-2.39a1.474 1.474 0 01-1.084-1.381c-.044-1.113-1.435-1.642-2.244-.853a1.474 1.474 0 01-.635.185z" fill={tw.accent} />
    <path d="M9.585 14.929l-2.121-2.121 1.06-1.06 1.06 1.06 3.182-3.182 1.061 1.061-4.242 4.242z" fill="#fff" />
  </svg>
);

const ReplyIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tw.textSecondary} strokeWidth={1.5}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);
const RetweetIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tw.textSecondary} strokeWidth={1.5}>
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);
const HeartIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tw.textSecondary} strokeWidth={1.5}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const ViewsIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={tw.textSecondary}>
    <path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" />
  </svg>
);
const BookmarkIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tw.textSecondary} strokeWidth={1.5}>
    <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z" />
  </svg>
);
const ShareIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tw.textSecondary} strokeWidth={1.5}>
    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c-.01 1.93-1.57 3.49-3.5 3.49H6.5C4.57 22 3 20.44 3 18.5V15h2v3.5c0 .83.67 1.5 1.5 1.5h11c.82 0 1.49-.68 1.5-1.51L19 15h2z" />
  </svg>
);

/* ────────────────────────────────────────────────────────
 *  Avatar
 * ──────────────────────────────────────────────────────── */
const Avatar: React.FC<{letter: string; color: string; size: number; online?: boolean}> = ({letter, color, size, online}) => (
  <div style={{position: 'relative', flexShrink: 0}}>
    <div style={{
      width: size, height: size, borderRadius: size / 2, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
    }}>
      {letter}
    </div>
    {online && (
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14,
        background: '#00ba7c', border: '2px solid #000',
      }} />
    )}
  </div>
);

/* ────────────────────────────────────────────────────────
 *  Mini candlestick chart SVG (embedded in Ansem tweet)
 * ──────────────────────────────────────────────────────── */
const MiniChart: React.FC = () => {
  // Realistic WIF/USD price action: dip → recovery → breakout
  // [open, close, low, high] in actual dollar values
  const candles = [
    [1.82, 1.74, 1.68, 1.85], [1.74, 1.69, 1.65, 1.78], [1.70, 1.78, 1.66, 1.82],
    [1.78, 1.72, 1.68, 1.80], [1.72, 1.65, 1.60, 1.75], [1.66, 1.58, 1.54, 1.69],
    [1.58, 1.64, 1.55, 1.68], [1.64, 1.72, 1.62, 1.76], [1.72, 1.80, 1.70, 1.84],
    [1.80, 1.76, 1.73, 1.83], [1.76, 1.85, 1.74, 1.88], [1.85, 1.82, 1.78, 1.90],
    [1.82, 1.92, 1.80, 1.95], [1.92, 1.96, 1.88, 2.00], [1.96, 2.04, 1.93, 2.08],
    [2.04, 1.98, 1.94, 2.06], [1.98, 2.06, 1.96, 2.10], [2.06, 2.10, 2.02, 2.14],
  ];
  // Volume bars (normalized 0-1)
  const volumes = [
    0.4, 0.5, 0.6, 0.3, 0.7, 0.9, 0.5, 0.6, 0.7, 0.4, 0.8, 0.3, 0.9, 0.8, 1.0, 0.5, 0.6, 0.7,
  ];
  const priceMin = 1.50;
  const priceMax = 2.18;
  const candleW = 22;
  const gap = 6;
  const chartW = candles.length * (candleW + gap);
  const chartH = 110;
  const volH = 30;
  const scaleY = (v: number) => chartH - ((v - priceMin) / (priceMax - priceMin)) * chartH;
  const priceLevels = [1.60, 1.80, 2.00];

  return (
    <div style={{
      margin: '8px 0', borderRadius: 16, overflow: 'hidden',
      background: '#0d1117', border: `1px solid ${tw.border}`,
    }}>
      {/* Header bar */}
      <div style={{
        padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: '#9945FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
          }}>W</div>
          <span style={{color: tw.textPrimary, fontSize: 14, fontWeight: 700}}>WIF / USD</span>
          <span style={{color: '#00ba7c', fontSize: 13, fontWeight: 600}}>+12.4%</span>
        </div>
        <div style={{display: 'flex', gap: 12}}>
          {['1H', '4H', '1D', '1W'].map((t, i) => (
            <span key={i} style={{
              color: t === '4H' ? tw.textPrimary : tw.textSecondary,
              fontSize: 12, fontWeight: t === '4H' ? 700 : 400,
              background: t === '4H' ? 'rgba(255,255,255,0.08)' : 'transparent',
              padding: '2px 6px', borderRadius: 4,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{padding: '8px 14px 6px', position: 'relative'}}>
        <svg width={chartW} height={chartH + volH + 4} viewBox={`0 0 ${chartW} ${chartH + volH + 4}`}
          style={{display: 'block', width: '100%', height: 'auto'}}>
          {/* Horizontal grid + price labels */}
          {priceLevels.map(p => (
            <g key={p}>
              <line x1={0} y1={scaleY(p)} x2={chartW} y2={scaleY(p)}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4,4" />
              <text x={chartW - 2} y={scaleY(p) - 4} textAnchor="end"
                fill={tw.textSecondary} fontSize={9} fontFamily={tw.font}>
                ${p.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Candlesticks */}
          {candles.map((c, i) => {
            const [open, close, low, high] = c;
            const green = close >= open;
            const color = green ? '#00ba7c' : '#ef4444';
            const x = i * (candleW + gap);
            const bodyTop = scaleY(Math.max(open, close));
            const bodyBot = scaleY(Math.min(open, close));
            const bodyH = Math.max(bodyBot - bodyTop, 1.5);
            return (
              <g key={i}>
                <line x1={x + candleW / 2} y1={scaleY(high)} x2={x + candleW / 2} y2={scaleY(low)}
                  stroke={color} strokeWidth={1.5} />
                <rect x={x + 3} y={bodyTop} width={candleW - 6} height={bodyH}
                  fill={green ? color : 'transparent'} stroke={color} strokeWidth={1.2} rx={1.5} />
              </g>
            );
          })}

          {/* Volume bars */}
          {volumes.map((v, i) => {
            const x = i * (candleW + gap);
            const green = candles[i][1] >= candles[i][0];
            const barH = v * volH;
            return (
              <rect key={`v${i}`} x={x + 4} y={chartH + 4 + (volH - barH)} width={candleW - 8} height={barH}
                fill={green ? 'rgba(0,186,124,0.25)' : 'rgba(239,68,68,0.25)'} rx={1} />
            );
          })}
        </svg>
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{display: 'flex', gap: 16}}>
          <span style={{color: tw.textSecondary, fontSize: 11}}>Apr 24</span>
          <span style={{color: tw.textSecondary, fontSize: 11}}>Apr 26</span>
          <span style={{color: tw.textSecondary, fontSize: 11}}>Apr 28</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <span style={{color: tw.textPrimary, fontSize: 13, fontWeight: 700}}>$2.10</span>
          <span style={{color: '#00ba7c', fontSize: 11}}>H: $2.14</span>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
 *  Left Sidebar
 * ──────────────────────────────────────────────────────── */
const Sidebar: React.FC<{frame: number}> = ({frame}) => {
  // Notification badge count grows: 12 → 28 → 47
  const badgeCount = frame < 80 ? 12 : frame < 200 ? 28 : 47;
  const badgePulse = frame === 80 || frame === 200; // pulse on change (simplified)

  const items: {icon: React.FC; label: string; active?: boolean; badge?: number}[] = [
    {icon: HomeIcon, label: 'Home', active: true},
    {icon: ExploreIcon, label: 'Explore'},
    {icon: NotifIcon, label: 'Notifications', badge: badgeCount},
    {icon: MessagesIcon, label: 'Messages'},
    {icon: GrokIcon, label: 'Grok'},
    {icon: PremiumIcon, label: 'Premium'},
    {icon: ProfileIcon, label: 'Profile'},
  ];

  return (
    <div style={{
      width: SIDEBAR_W, height: '100%',
      display: 'flex', flexDirection: 'column', padding: '12px 12px',
      fontFamily: tw.font, flexShrink: 0,
    }}>
      {/* X Logo */}
      <div style={{padding: '8px 12px', marginBottom: 8}}>
        <XLogo />
      </div>

      {/* Nav items */}
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px',
            borderRadius: 28, position: 'relative',
          }}>
            <div style={{position: 'relative'}}>
              <Icon />
              {item.badge && (
                <div style={{
                  position: 'absolute', top: -6, right: -10,
                  background: '#1d9bf0', borderRadius: 10, minWidth: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', fontSize: 11, fontWeight: 700, color: '#fff',
                  border: '2px solid #000',
                  transform: badgePulse ? 'scale(1.2)' : 'scale(1)',
                }}>
                  {item.badge}
                </div>
              )}
            </div>
            <span style={{
              color: tw.textPrimary, fontSize: 18,
              fontWeight: item.active ? 700 : 400,
            }}>
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Post button */}
      <div style={{
        background: tw.accent, color: '#fff', borderRadius: 28,
        padding: '12px 0', textAlign: 'center', fontSize: 16, fontWeight: 700,
        marginTop: 16,
      }}>
        Post
      </div>

      {/* User at bottom */}
      <div style={{marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', gap: 8}}>
        <Avatar letter="U" color="#1d9bf0" size={36} />
        <div>
          <div style={{color: tw.textPrimary, fontSize: 14, fontWeight: 700}}>anon</div>
          <div style={{color: tw.textSecondary, fontSize: 13}}>@degen_user</div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
 *  Thread connector line (vertical line from avatar)
 * ──────────────────────────────────────────────────────── */
/* Thread lines are now handled per-reply via showTopConnector prop
 * and per-group via a wrapper in the feed assembly. */

/* ────────────────────────────────────────────────────────
 *  Engagement bar
 * ──────────────────────────────────────────────────────── */
const MiniEngagement: React.FC<{replies: string; retweets: string; likes: string; views: string}> = ({
  replies, retweets, likes, views,
}) => (
  <div style={{display: 'flex', gap: 24, marginTop: 10}}>
    {[
      {icon: <ReplyIcon />, val: replies},
      {icon: <RetweetIcon />, val: retweets},
      {icon: <HeartIcon />, val: likes},
      {icon: <ViewsIcon />, val: views},
    ].map((item, i) => (
      <div key={i} style={{display: 'flex', alignItems: 'center', gap: 4, color: tw.textSecondary, fontSize: 13}}>
        {item.icon}
        {item.val !== '0' && <span>{item.val}</span>}
      </div>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────
 *  Reply data type
 * ──────────────────────────────────────────────────────── */
interface ReplyData {
  name: string;
  handle: string;
  avatarLetter: string;
  avatarColor: string;
  content: string;
  likes: string;
  views: string;
}

/* ────────────────────────────────────────────────────────
 *  Reply component (with thread connector option)
 * ──────────────────────────────────────────────────────── */
const Reply: React.FC<{
  data: ReplyData; kolHandle: string; startFrame: number; frame: number;
  timeLabel: string; timeColor: string;
  showTopConnector?: boolean; showBottomConnector?: boolean;
}> = ({data, kolHandle, startFrame, frame, timeLabel, timeColor, showTopConnector, showBottomConnector}) => {
  if (frame < startFrame) return null;
  const elapsed = frame - startFrame;
  const opacity = interpolate(elapsed, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slideY = interpolate(elapsed, [0, 14], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});

  return (
    <div style={{
      opacity, transform: `translateY(${slideY}px)`,
      padding: '12px 16px', borderBottom: `1px solid ${tw.border}`,
      position: 'relative',
    }}>
      {/* Top connector line — from top of cell down to avatar center */}
      {showTopConnector && (
        <div style={{
          position: 'absolute', left: 35, top: 0, width: 2, height: 32,
          background: tw.border, borderRadius: 1,
        }} />
      )}
      {/* Bottom connector line — from avatar center down to bottom of cell */}
      {showBottomConnector && (
        <div style={{
          position: 'absolute', left: 35, top: 52, width: 2, bottom: 0,
          background: tw.border, borderRadius: 1,
        }} />
      )}
      <div style={{display: 'flex', gap: 10}}>
        <Avatar letter={data.avatarLetter} color={data.avatarColor} size={40} />
        <div style={{flex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
            <span style={{color: tw.textPrimary, fontSize: 15, fontWeight: 700}}>{data.name}</span>
            <span style={{color: tw.textSecondary, fontSize: 14}}>{data.handle}</span>
            <span style={{color: timeColor, fontSize: 14, fontWeight: timeColor !== tw.textSecondary ? 600 : 400}}>· {timeLabel}</span>
          </div>
          <div style={{color: tw.textSecondary, fontSize: 14, marginTop: 2}}>
            Replying to <span style={{color: tw.textLink}}>{kolHandle}</span>
          </div>
          <div style={{color: tw.textPrimary, fontSize: 15, lineHeight: 1.45, marginTop: 6}}>
            {data.content}
          </div>
          <MiniEngagement replies="0" retweets="0" likes={data.likes} views={data.views} />
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
 *  "Show more replies" link
 * ──────────────────────────────────────────────────────── */
const ShowMoreReplies: React.FC<{startFrame: number; frame: number; count: string}> = ({startFrame, frame, count}) => {
  if (frame < startFrame) return null;
  const elapsed = frame - startFrame;
  const opacity = interpolate(elapsed, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{
      opacity, padding: '14px 16px', borderBottom: `1px solid ${tw.border}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{width: 40}} /> {/* avatar spacer */}
      <span style={{color: tw.textLink, fontSize: 14}}>Show more replies ({count})</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
 *  POST DATA
 * ════════════════════════════════════════════════════════ */

const ANSEM_REPLIES: (ReplyData & {enterFrame: number})[] = [
  {
    name: 'cryptobro99', handle: '@cryptobro99', avatarLetter: 'C', avatarColor: '#E8A838',
    content: "what's a safe entry on WIF? 2.3 or wait for a dip? need to know before i ape ser",
    likes: '12', views: '1.2K', enterFrame: 50,
  },
  {
    name: 'degen_sarah', handle: '@degen_sarah', avatarLetter: 'S', avatarColor: '#9E5BA8',
    content: "how do i even check if a token is rugged before buying?? is there a tool for this or do i just pray? literally nobody teaches this stuff",
    likes: '34', views: '2.8K', enterFrame: 82,
  },
  {
    name: 'bag_holder_abu', handle: '@aby_trades', avatarLetter: 'A', avatarColor: '#BE5B5B',
    content: "been asking in your replies for 2 weeks now. 0 responses. just vibes and charts but never any actionable alpha for the regular people following you.",
    likes: '89', views: '8.2K', enterFrame: 118,
  },
];

const MURAD_REPLIES: (ReplyData & {enterFrame: number})[] = [
  {
    name: 'pumpfun_andy', handle: '@pumpfun_andy', avatarLetter: 'P', avatarColor: '#4A9EE8',
    content: "which memecoins ser?? give us names not vibes. we're out here guessing and getting rugged every other day",
    likes: '47', views: '4.1K', enterFrame: 225,
  },
  {
    name: 'greyhaired.sol', handle: '@GreyHairedTrade', avatarLetter: 'G', avatarColor: '#7B8794',
    content: "got rugged on the last one you hinted at. lost 4 SOL on a pump.fun launch that went to zero in 3 minutes. any actually safe plays?",
    likes: '63', views: '5.6K', enterFrame: 258,
  },
  {
    name: 'Hira', handle: '@Hiraweb3', avatarLetter: 'H', avatarColor: '#E85BA8',
    content: "asking for the 10th time. anyone home? 183 replies and not a single answer. we follow you for alpha but get nothing back.",
    likes: '112', views: '9.3K', enterFrame: 295,
  },
];

/* ────────────────────────────────────────────────────────
 *  Single continuous scrolling feed
 *  (replaces cut-based scenes with natural scroll)
 * ──────────────────────────────────────────────────────── */
const FEED_SCROLL: {start: number; end: number; from: number; to: number}[] = [
  // Scroll to reveal Ansem replies
  {start: 68, end: 95, from: 0, to: 80},
  {start: 100, end: 125, from: 80, to: 200},
  {start: 130, end: 155, from: 200, to: 340},
  // "Show more" appears, then scroll to Murad
  {start: 165, end: 200, from: 340, to: 640},
  // Scroll through Murad replies
  {start: 240, end: 265, from: 640, to: 760},
  {start: 270, end: 295, from: 760, to: 890},
  {start: 305, end: 330, from: 890, to: 1020},
];

function computeFeedScroll(frame: number): number {
  let offset = 0;
  for (const s of FEED_SCROLL) {
    if (frame >= s.end) offset = s.to;
    else if (frame >= s.start) {
      const t = (frame - s.start) / (s.end - s.start);
      const eased = t * t * (3 - 2 * t);
      offset = s.from + (s.to - s.from) * eased;
      return offset;
    } else return offset;
  }
  return offset;
}

/* ────────────────────────────────────────────────────────
 *  Post detail block (KOL tweet with all chrome)
 * ──────────────────────────────────────────────────────── */
const PostBlock: React.FC<{
  name: string; handle: string; avatarLetter: string; avatarColor: string;
  content: string; timestamp: string; views: string;
  repliesCount: string; repostsCount: string; likesCount: string;
  showChart?: boolean; showBottomLine?: boolean;
  startFrame: number; frame: number;
}> = (props) => {
  if (props.frame < props.startFrame) return null;
  const elapsed = props.frame - props.startFrame;
  const opacity = interpolate(elapsed, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{opacity, fontFamily: tw.font, position: 'relative'}}>
      {/* Line from KOL avatar down to the replies below */}
      {props.showBottomLine && (
        <div style={{
          position: 'absolute', left: 37, top: 56, width: 2, bottom: 0,
          background: tw.border, borderRadius: 1, zIndex: 0,
        }} />
      )}

      {/* Author row */}
      <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 4px'}}>
        <Avatar letter={props.avatarLetter} color={props.avatarColor} size={44} online />
        <div style={{flex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
            <span style={{color: tw.textPrimary, fontSize: 16, fontWeight: 700}}>{props.name}</span>
            <VerifiedBadge />
          </div>
          <span style={{color: tw.textSecondary, fontSize: 14}}>{props.handle}</span>
        </div>
        <div style={{
          background: tw.textPrimary, color: '#000', borderRadius: 20,
          padding: '6px 16px', fontSize: 14, fontWeight: 700,
        }}>
          Subscribe
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '8px 16px 0', color: tw.textPrimary, fontSize: 17, lineHeight: 1.5, whiteSpace: 'pre-wrap'}}>
        {props.content}
      </div>

      {/* Chart (optional) — full width like real X embedded media */}
      {props.showChart && (
        <div style={{padding: '4px 16px 0'}}>
          <MiniChart />
        </div>
      )}

      {/* Timestamp + views */}
      <div style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 4}}>
        <span style={{color: tw.textSecondary, fontSize: 14}}>{props.timestamp}</span>
        <span style={{color: tw.textSecondary}}>·</span>
        <span style={{color: tw.textPrimary, fontSize: 14, fontWeight: 700}}>{props.views}</span>
        <span style={{color: tw.textSecondary, fontSize: 14}}>Views</span>
      </div>

      <div style={{height: 1, background: tw.border, margin: '0 16px'}} />

      {/* Stats */}
      <div style={{padding: '12px 16px', display: 'flex', gap: 20}}>
        {[{c: props.repliesCount, l: 'Replies'}, {c: props.repostsCount, l: 'Reposts'}, {c: props.likesCount, l: 'Likes'}].map((s, i) => (
          <div key={i} style={{display: 'flex', gap: 4}}>
            <span style={{color: tw.textPrimary, fontSize: 14, fontWeight: 700}}>{s.c}</span>
            <span style={{color: tw.textSecondary, fontSize: 14}}>{s.l}</span>
          </div>
        ))}
      </div>

      <div style={{height: 1, background: tw.border, margin: '0 16px'}} />

      {/* Action bar */}
      <div style={{padding: '8px 16px', display: 'flex', justifyContent: 'space-around'}}>
        <ReplyIcon /><RetweetIcon /><HeartIcon /><BookmarkIcon /><ShareIcon />
      </div>

      <div style={{height: 1, background: tw.border, margin: '0 16px'}} />

      {/* Post your reply */}
      <div style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10}}>
        <Avatar letter="U" color="#1d9bf0" size={32} />
        <span style={{color: tw.textSecondary, fontSize: 15, flex: 1}}>Post your reply</span>
        <div style={{
          background: 'rgba(29,155,240,0.5)', color: 'rgba(255,255,255,0.5)',
          borderRadius: 20, padding: '6px 16px', fontSize: 14, fontWeight: 700,
        }}>
          Reply
        </div>
      </div>

      <div style={{height: 1, background: tw.border}} />

      {/* Sort */}
      <div style={{padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6}}>
        <span style={{color: tw.textSecondary, fontSize: 14}}>Relevant</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill={tw.textSecondary}><path d="M7 10l5 5 5-5z" /></svg>
      </div>

      <div style={{height: 1, background: tw.border}} />
    </div>
  );
};

/* ════════════════════════════════════════════════════════
 *  Counter overlay (frames 340–395)
 * ════════════════════════════════════════════════════════ */
const CounterOverlay: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 340) return null;

  // Dim everything
  const dimOpacity = interpolate(frame, [340, 355], [0, 0.88], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Zoom into worst reply first
  const zoomOpacity = interpolate(frame, [340, 348], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    * interpolate(frame, [356, 362], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const replyZoom = interpolate(frame, [340, 362], [1, 1.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});

  // Counter
  const counterOpacity = interpolate(frame, [360, 370], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const counterScale = interpolate(frame, [360, 375], [0.82, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const familiarOpacity = interpolate(frame, [376, 388], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 30}}>
      {/* Dark overlay */}
      <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${dimOpacity})`}} />

      {/* Zoomed reply card */}
      {zoomOpacity > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: zoomOpacity, paddingLeft: SIDEBAR_W,
        }}>
          <div style={{
            transform: `scale(${replyZoom})`,
            background: 'rgba(0,0,0,0.95)', borderRadius: 16, padding: '20px 24px',
            maxWidth: '70%', border: `1px solid ${tw.border}`,
          }}>
            <div style={{display: 'flex', gap: 10}}>
              <Avatar letter="H" color="#E85BA8" size={36} />
              <div>
                <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                  <span style={{color: tw.textPrimary, fontSize: 14, fontWeight: 700}}>Hira</span>
                  <span style={{color: tw.textSecondary, fontSize: 13}}>@Hiraweb3</span>
                  <span style={{color: '#f4212e', fontSize: 13, fontWeight: 600}}>· 2d</span>
                </div>
                <div style={{color: tw.textPrimary, fontSize: 16, lineHeight: 1.5, marginTop: 6}}>
                  asking for the 10th time.{'\n'}anyone home?{'\n\n'}183 replies and not a single answer.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter */}
      {frame >= 360 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            opacity: counterOpacity, transform: `scale(${counterScale})`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{fontSize: 52, fontWeight: 800, color: tw.textPrimary, letterSpacing: '-0.03em', lineHeight: 1}}>
              430 replies.
            </div>
            <div style={{fontSize: 52, fontWeight: 800, color: '#f4212e', letterSpacing: '-0.03em', lineHeight: 1}}>
              0 answers.
            </div>
          </div>
          <div style={{opacity: familiarOpacity, color: tw.textSecondary, fontSize: 20}}>
            sound familiar?
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
 *  Main export — continuous scrolling feed with sidebar
 *  Runs frames 0–395 (~13.2s)
 * ════════════════════════════════════════════════════════ */
export const TwitterFeedScreen: React.FC<{frame: number}> = ({frame}) => {
  const scrollOffset = computeFeedScroll(frame);

  // Time aging for Ansem replies
  const ansemTime = frame < 65 ? 'just now' : frame < 100 ? '2h' : '3d';
  const ansemTimeColor = frame >= 100 ? '#f4212e' : tw.textSecondary;

  // Time aging for Murad replies
  const muradLocalFrame = Math.max(0, frame - 200);
  const muradTime = muradLocalFrame < 30 ? '5m' : muradLocalFrame < 65 ? '6h' : '2d';
  const muradTimeColor = muradLocalFrame >= 65 ? '#f4212e' : tw.textSecondary;

  // Subtle cinematic zoom — kept small to avoid clipping content
  const contentZoom = interpolate(frame, [0, 340], [1, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // "Active now" indicators
  const activeAnsem = interpolate(frame, [90, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const activeMurad = interpolate(frame, [260, 270], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{
      width: '100%', height: '100%', background: tw.bg,
      fontFamily: tw.font, position: 'relative', overflow: 'hidden',
      display: 'flex',
    }}>
      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <Sidebar frame={frame} />

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div style={{flex: 1, position: 'relative', overflow: 'hidden', borderLeft: `1px solid ${tw.border}`}}>
        <div style={{
          transform: `scale(${contentZoom})`, transformOrigin: '50% 40%',
          height: '100%', position: 'relative',
        }}>
          {/* Fixed nav bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 53,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 28,
            borderBottom: `1px solid ${tw.border}`, zIndex: 10,
          }}>
            <BackArrow />
            <span style={{color: tw.textPrimary, fontSize: 20, fontWeight: 700}}>Post</span>
          </div>

          {/* "Active now" indicator */}
          {activeAnsem > 0 && frame < 200 && (
            <div style={{
              position: 'absolute', top: 58, right: 16, opacity: activeAnsem, zIndex: 11,
            }}>
              <div style={{
                background: '#1a2e1a', border: '1px solid #2d5a2d', borderRadius: 16,
                padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{width: 6, height: 6, borderRadius: 3, background: '#00ba7c'}} />
                <span style={{color: '#00ba7c', fontSize: 12, fontWeight: 500}}>Active now</span>
              </div>
            </div>
          )}
          {activeMurad > 0 && frame >= 200 && (
            <div style={{
              position: 'absolute', top: 58, right: 16, opacity: activeMurad, zIndex: 11,
            }}>
              <div style={{
                background: '#1a2e1a', border: '1px solid #2d5a2d', borderRadius: 16,
                padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{width: 6, height: 6, borderRadius: 3, background: '#00ba7c'}} />
                <span style={{color: '#00ba7c', fontSize: 12, fontWeight: 500}}>Active now</span>
              </div>
            </div>
          )}

          {/* Scrolling feed */}
          <div style={{
            paddingTop: 53,
            transform: `translateY(${-scrollOffset}px)`,
          }}>
            {/* ── ANSEM POST + REPLIES GROUP ── */}
            <PostBlock
              name="Ansem" handle="@blknoiz06" avatarLetter="A" avatarColor="#5B4A9E"
              content={'$WIF looking interesting here 👀\n\nchart reclaiming key levels after the dip.\nvolume spiking on 4h. not financial advice\nbut im watching this one closely'}
              showChart
              timestamp="12:01 AM · Apr 28, 2026" views="4,589"
              repliesCount="430" repostsCount="19" likesCount="75"
              startFrame={5} frame={frame}
            />

            {/* Ansem replies — flat replies, no thread lines (matches real X) */}
            {ANSEM_REPLIES.map((r, i) => (
              <Reply key={`a${i}`} data={r} kolHandle="@blknoiz06" startFrame={r.enterFrame} frame={frame}
                timeLabel={ansemTime} timeColor={ansemTimeColor}
              />
            ))}

            {/* Show more replies */}
            <ShowMoreReplies startFrame={140} frame={frame} count="427" />

            {/* ── SEPARATOR between post groups ── */}
            <div style={{height: 8, background: '#16181c', borderTop: `1px solid ${tw.border}`, borderBottom: `1px solid ${tw.border}`}} />

            {/* ── MURAD POST + REPLIES GROUP ── */}
            <PostBlock
              name="Murad" handle="@MustStopMurad" avatarLetter="M" avatarColor="#C73E1D"
              content={'memecoin szn is far from over\n\nnew meta forming. the ones who see it\nearly will eat. do your own research.'}
              timestamp="3:22 PM · Apr 27, 2026" views="1.2M"
              repliesCount="183" repostsCount="892" likesCount="3.1K"
              startFrame={190} frame={frame}
            />

            {/* Murad replies — flat replies, no thread lines */}
            {MURAD_REPLIES.map((r, i) => (
              <Reply key={`m${i}`} data={r} kolHandle="@MustStopMurad" startFrame={r.enterFrame} frame={frame}
                timeLabel={muradTime} timeColor={muradTimeColor}
              />
            ))}

            {/* Show more replies */}
            <ShowMoreReplies startFrame={315} frame={frame} count="180" />
          </div>
        </div>
      </div>

      {/* ═══════ COUNTER OVERLAY ═══════ */}
      <CounterOverlay frame={frame} />
    </div>
  );
};
