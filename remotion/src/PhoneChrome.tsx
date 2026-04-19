import {interpolate, Easing} from 'remotion';
import {colors, phone, typography} from './tokens';

const STATUS_ICON = {fill: '#111'};

/** Status bar at the top of the screen (9:41 + signal/wifi/battery). */
export const StatusBar: React.FC<{opacity: number}> = ({opacity}) => (
  <div
    style={{
      position: 'absolute',
      top: 12,
      left: 0,
      right: 0,
      height: 20,
      padding: '0 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: typography.stack,
      zIndex: 5,
    }}
  >
    <div style={{fontWeight: 600, color: '#111', fontSize: 14, opacity}}>9:41</div>
    <div style={{display: 'flex', gap: 6, alignItems: 'center', opacity}}>
      {/* Signal bars */}
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
        <rect x="0" y="7" width="3" height="4" rx="0.5" {...STATUS_ICON} />
        <rect x="4.5" y="5" width="3" height="6" rx="0.5" {...STATUS_ICON} />
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" {...STATUS_ICON} />
        <rect x="13.5" y="0" width="3" height="11" rx="0.5" {...STATUS_ICON} />
      </svg>
      {/* WiFi */}
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
        <path d="M1 4.5 C3 2 12 2 14 4.5" stroke="#111" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        <path d="M3 6.8 C4.5 5.3 10.5 5.3 12 6.8" stroke="#111" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        <circle cx="7.5" cy="9" r="1.1" fill="#111"/>
      </svg>
      {/* Battery */}
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
        <rect x="0.4" y="0.4" width="20" height="10.2" rx="2.5" stroke="#111" strokeWidth="0.8" fill="none"/>
        <rect x="1.8" y="1.8" width="14" height="7.4" rx="1.4" fill="#111"/>
        <rect x="21" y="3.5" width="1.4" height="4" rx="0.5" fill="#111"/>
      </svg>
    </div>
  </div>
);

/** Chat header with back pill, Raze/bot label, mascot avatar. */
export const ChatHeader: React.FC<{mascotSrc: string}> = ({mascotSrc}) => (
  <div
    style={{
      position: 'absolute',
      top: phone.STATUS_H,
      left: 0,
      right: 0,
      height: phone.HEADER_H,
      background: colors.headerBg,
      borderBottom: `1px solid ${colors.divider}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* Back pill */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 20,
        padding: '4px 10px 4px 8px',
        gap: 3,
      }}
    >
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
        <path d="M6 2 L2 7 L6 12" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{fontSize: 13, color: '#111', fontWeight: 500}}>271</span>
    </div>
    {/* Center label */}
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <span style={{fontSize: 16, fontWeight: 700, color: '#111'}}>Raze</span>
      <span style={{fontSize: 11, color: colors.purple, fontWeight: 500}}>bot</span>
    </div>
    {/* Avatar */}
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        border: `2px solid ${colors.purple}`,
        overflow: 'hidden',
        background: '#F0EDFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src={mascotSrc} alt="" style={{width: '92%', height: '92%', objectFit: 'contain'}} />
    </div>
  </div>
);

/** Composer bar at the bottom. */
export const Composer: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: phone.COMPOSER_H,
      background: colors.headerBg,
      borderTop: `1px solid ${colors.divider}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 10,
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* Paperclip */}
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M15 7 L8 14 A3 3 0 0 0 12 18 L18 12 A5 5 0 0 0 11 5 L5 11 A7 7 0 0 0 14 20"
        stroke="#666"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>

    {/* Input pill */}
    <div
      style={{
        flex: 1,
        height: 40,
        background: '#efefef',
        borderRadius: 22,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}
    >
      <span style={{color: colors.textSecondary, fontSize: 14}}>Message</span>
    </div>

    {/* Moon */}
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M16 12 A6 6 0 1 1 10 6 A5 5 0 0 0 16 12 Z" stroke="#666" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
    </svg>

    {/* Mic */}
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
      <rect x="7" y="2" width="6" height="11" rx="3" stroke="#666" strokeWidth="1.6" fill="none"/>
      <path d="M4 11 A6 6 0 0 0 16 11 M10 17 V20 M6 20 H14" stroke="#666" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);
