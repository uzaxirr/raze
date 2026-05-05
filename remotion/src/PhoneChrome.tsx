import {colors, phone, typography} from './tokens';

/** Status bar — iOS style with time, signal, wifi, battery. */
export const StatusBar: React.FC<{opacity: number}> = ({opacity}) => (
  <div
    style={{
      position: 'absolute',
      top: 14,
      left: 0,
      right: 0,
      height: 18,
      padding: '0 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: typography.stack,
      zIndex: 5,
    }}
  >
    <div style={{fontWeight: 600, color: '#fff', fontSize: 15, letterSpacing: '0.01em', opacity}}>9:41</div>
    <div style={{display: 'flex', gap: 5, alignItems: 'center', opacity}}>
      {/* Signal */}
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
        <rect x="0" y="8" width="3" height="4" rx="0.7" fill="#fff" />
        <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.7" fill="#fff" />
        <rect x="9" y="3" width="3" height="9" rx="0.7" fill="#fff" />
        <rect x="13.5" y="0" width="3" height="12" rx="0.7" fill="#fff" />
      </svg>
      {/* WiFi */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <path d="M0.5 3.8C3.5 1.2 12.5 1.2 15.5 3.8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d="M3.2 6.5C5 4.8 11 4.8 12.8 6.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d="M5.8 9.2C6.8 8.2 9.2 8.2 10.2 9.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <circle cx="8" cy="11" r="1" fill="#fff"/>
      </svg>
      {/* Battery */}
      <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="#fff" strokeWidth="1" fill="none" opacity={0.35}/>
        <rect x="2" y="2" width="17" height="8" rx="1.5" fill="#fff"/>
        <path d="M24 4.5V7.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity={0.4}/>
      </svg>
    </div>
  </div>
);

/** Telegram-style chat header — back arrow, avatar, name, status, icons. */
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
      padding: '0 8px',
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* Back arrow + unread count */}
    <div style={{display: 'flex', alignItems: 'center', gap: 2, padding: '4px 4px 4px 0'}}>
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
        <path d="M10 2L2 10L10 18" stroke={colors.purple} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Unread badge */}
      <div style={{
        background: colors.purple,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        marginLeft: 2,
      }}>
        <span style={{fontSize: 12, fontWeight: 700, color: '#fff'}}>3</span>
      </div>
    </div>

    {/* Avatar */}
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#F0EDFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
        flexShrink: 0,
      }}
    >
      <img src={mascotSrc} alt="" style={{width: '92%', height: '92%', objectFit: 'contain'}} />
    </div>

    {/* Name + online status */}
    <div style={{flex: 1, marginLeft: 10, display: 'flex', flexDirection: 'column', gap: 1}}>
      <span style={{fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em'}}>Raze</span>
      <span style={{fontSize: 12, color: '#888', fontWeight: 400}}>bot</span>
    </div>

    {/* Right icons — video call + more */}
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      {/* Video call icon */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="13" height="12" rx="2" stroke={colors.purple} strokeWidth="1.8" fill="none"/>
        <path d="M15 10L21 7V17L15 14" stroke={colors.purple} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      </svg>
      {/* More icon (three dots) */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="4" r="1.5" fill={colors.purple}/>
        <circle cx="10" cy="10" r="1.5" fill={colors.purple}/>
        <circle cx="10" cy="16" r="1.5" fill={colors.purple}/>
      </svg>
    </div>
  </div>
);

/** Telegram-style composer — attachment, input field, voice/send. */
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
      padding: '0 8px',
      gap: 6,
      fontFamily: typography.stack,
      zIndex: 4,
    }}
  >
    {/* Attachment (paperclip) */}
    <div style={{padding: '4px'}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M21.44 11.05L12.25 20.24A5.37 5.37 0 014.63 12.62L13.82 3.44A3.58 3.58 0 0118.89 8.5L9.7 17.69A1.79 1.79 0 017.16 15.15L16.35 5.96"
          stroke="#999"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    {/* Text input */}
    <div
      style={{
        flex: 1,
        height: 36,
        background: '#2A2A2E',
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{color: '#555', fontSize: 15}}>Message</span>
    </div>

    {/* Emoji */}
    <div style={{padding: '4px'}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="1.5"/>
        <circle cx="9" cy="10" r="1" fill="#999"/>
        <circle cx="15" cy="10" r="1" fill="#999"/>
        <path d="M8.5 14.5C9.5 16 14.5 16 15.5 14.5" stroke="#999" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>

    {/* Mic / Voice */}
    <div style={{padding: '4px'}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="2" width="8" height="13" rx="4" stroke={colors.purple} strokeWidth="1.6" fill="none"/>
        <path d="M5 11A7 7 0 0019 11" stroke={colors.purple} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d="M12 18V21M9 21H15" stroke={colors.purple} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  </div>
);
