// Ghost mascot SVGs — 12 unique emotions with detailed accessories

// Shared constants
const BODY = "M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C53 156, 58 161, 64 166 C70 171, 75 166, 80 161 C86 156, 91 161, 97 166 C103 171, 108 166, 113 161 C119 156, 124 161, 130 166 C136 171, 141 166, 146 161 C152 156, 158 161, 165 166 C172 161, 168 155, 168 150 L168 98 C168 58, 140 25, 100 25Z";
const SHINE = "M65 40 C50 55, 42 78, 42 98";
const BLUSH_L = { cx: 64, cy: 108 };
const BLUSH_R = { cx: 140, cy: 108 };

// Standard eye with full detail: sclera → iris → pupil → highlight
function Eye({ cx, cy, irisColor = "#2D1B69", pupilColor = "#1A1040", size = 1, className = "" }: {
  cx: number; cy: number; irisColor?: string; pupilColor?: string; size?: number; className?: string;
}) {
  const s = size;
  return (
    <g className={className}>
      <ellipse cx={cx} cy={cy} rx={18 * s} ry={20 * s} fill="#FFFFFF" />
      <ellipse cx={cx} cy={cy} rx={12 * s} ry={14 * s} fill={irisColor} />
      <ellipse cx={cx + 2 * s} cy={cy - 3 * s} rx={7 * s} ry={8 * s} fill={pupilColor} />
      <ellipse cx={cx - 1 * s} cy={cy - 6 * s} rx={3.5 * s} ry={3 * s} fill="#FFFFFF" opacity="0.95" />
    </g>
  );
}

function Blush() {
  return (
    <>
      <ellipse cx={BLUSH_L.cx} cy={BLUSH_L.cy} rx={10} ry={5} fill="#FF8FCE" opacity="0.3" />
      <ellipse cx={BLUSH_R.cx} cy={BLUSH_R.cy} rx={10} ry={5} fill="#FF8FCE" opacity="0.3" />
    </>
  );
}

function Shell({ children, className = "", w = 160, h = 170, vb = "0 0 200 220" }: {
  children: React.ReactNode; className?: string; w?: number; h?: number; vb?: string;
}) {
  return (
    <svg width={w} height={h} viewBox={vb} fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d={BODY} fill="#9945FF" />
      <path d={SHINE} stroke="#B76EFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.3" />
      {children}
      <Blush />
    </svg>
  );
}

// ─── 1. DOLLAR EYES — Check Balance ─────────────────────────────────
export function GhostDollarEyes({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Left eye with $ iris */}
      <ellipse cx={78} cy={88} rx={20} ry={22} fill="#FFFFFF" />
      <ellipse cx={78} cy={88} rx={14} ry={16} fill="#14A86C" />
      <text x="70" y="96" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="24" fill="#FFFFFF">$</text>
      <ellipse cx={74} cy={78} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.7" />
      {/* Right eye with $ iris */}
      <ellipse cx={126} cy={88} rx={20} ry={22} fill="#FFFFFF" />
      <ellipse cx={126} cy={88} rx={14} ry={16} fill="#14A86C" />
      <text x="118" y="96" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="24" fill="#FFFFFF">$</text>
      <ellipse cx={122} cy={78} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.7" />
      {/* Big excited grin */}
      <path d="M82 118 C90 132, 110 132, 118 118" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Floating coin */}
      <circle cx="155" cy="52" r="10" fill="#FFD166" opacity="0.8" />
      <circle cx="155" cy="52" r="7" fill="#FFBF00" opacity="0.6" />
      <text x="151" y="57" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="12" fill="#FFFFFF" opacity="0.9">$</text>
    </Shell>
  );
}

// ─── 2. SHOCKED — Security Alert ────────────────────────────────────
export function GhostAlert({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Extra-wide shocked eyes with tiny pupils */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={84} rx={22} ry={26} fill="#FFFFFF" />
        <ellipse cx={78} cy={84} rx={10} ry={12} fill="#2D1B69" />
        <ellipse cx={79} cy={81} rx={5} ry={6} fill="#1A1040" />
        <ellipse cx={76} cy={77} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.95" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={84} rx={22} ry={26} fill="#FFFFFF" />
        <ellipse cx={126} cy={84} rx={10} ry={12} fill="#2D1B69" />
        <ellipse cx={127} cy={81} rx={5} ry={6} fill="#1A1040" />
        <ellipse cx={124} cy={77} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.95" />
      </g>
      {/* O-shaped shocked mouth */}
      <ellipse cx={102} cy={120} rx={10} ry={9} fill="#7B2FE0" />
      <ellipse cx={102} cy={118} rx={6} ry={4} fill="#5A1FBF" />
      {/* Sweat drops */}
      <ellipse cx={50} cy={62} rx={3} ry={5} fill="#89CFF0" opacity="0.6" />
      <ellipse cx={154} cy={58} rx={2.5} ry={4} fill="#89CFF0" opacity="0.5" />
      {/* Exclamation mark */}
      <rect x="158" y="38" width="5" height="18" rx="2.5" fill="#FF4545" opacity="0.7" />
      <circle cx="160.5" cy="62" r="2.5" fill="#FF4545" opacity="0.7" />
    </Shell>
  );
}

// ─── 3. DETECTIVE — Token Autopsies ─────────────────────────────────
export function GhostDetective({ className = "" }: { className?: string }) {
  return (
    <Shell className={className} vb="-10 -20 220 260">
      {/* Detective fedora hat */}
      <ellipse cx={100} cy={30} rx={62} ry={10} fill="#1A1A1A" />
      <path d="M45 30 C45 10, 70 -5, 100 -5 C130 -5, 155 10, 155 30" fill="#2A2A2A" />
      <path d="M40 30 C40 25, 48 20, 100 20 C152 20, 160 25, 160 30" fill="#1A1A1A" />
      {/* Hat band */}
      <rect x="52" y="18" width="96" height="6" rx="2" fill="#9945FF" />
      {/* Left eye — normal */}
      <Eye cx={78} cy={88} className="ghost-eye-left" />
      {/* Right eye — seen through magnifying glass (larger) */}
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={88} rx={18} ry={20} fill="#FFFFFF" />
        <ellipse cx={126} cy={88} rx={12} ry={14} fill="#2D1B69" />
        <ellipse cx={128} cy={85} rx={7} ry={8} fill="#1A1040" />
        <ellipse cx={125} cy={82} rx={3.5} ry={3} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Magnifying glass — large, detailed */}
      <circle cx={138} cy={88} r={30} stroke="#8B6914" strokeWidth="4" fill="none" />
      <circle cx={138} cy={88} r={28} stroke="#B8860B" strokeWidth="1.5" fill="rgba(200,220,255,0.15)" />
      {/* Glass reflection arc */}
      <path d="M120 72 C124 66, 134 64, 140 68" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Handle */}
      <rect x="160" y="108" width="8" height="32" rx="4" fill="#8B6914" transform="rotate(35, 164, 124)" />
      <rect x="161" y="110" width="4" height="28" rx="2" fill="#B8860B" transform="rotate(35, 164, 124)" />
      {/* Slight knowing smirk */}
      <path d="M86 118 C92 124, 108 122, 114 116" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    </Shell>
  );
}

// ─── 4. COOL SHADES — Instant Swaps ────────────────────────────────
export function GhostWinking({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Cool sunglasses */}
      <path d="M52 82 L56 76 L96 76 L100 82 L104 76 L148 76 L152 82 L148 100 C144 108, 108 108, 104 100 L100 94 L96 100 C92 108, 56 108, 52 100 Z" fill="#1A1A1A" />
      {/* Lens shine */}
      <path d="M62 80 C66 78, 78 78, 82 80" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
      <path d="M112 80 C116 78, 128 78, 132 80" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />
      {/* Temple arms */}
      <path d="M52 80 L32 76" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      <path d="M152 80 L168 76" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      {/* Confident grin */}
      <path d="M82 120 C90 130, 112 130, 120 120" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Sparkle near face */}
      <path d="M160 60 L162 54 L164 60 L170 62 L164 64 L162 70 L160 64 L154 62Z" fill="#FFD166" opacity="0.7" className="animate-sparkle" />
      {/* Thumbs up arm */}
      <path d="M168 105 C176 96, 180 82, 178 68" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Thumb */}
      <circle cx={178} cy={64} r={5} fill="#9945FF" />
      <rect x="175" y="48" width="6" height="16" rx="3" fill="#9945FF" />
      {/* Thumb nail highlight */}
      <rect x="176" y="49" width="4" height="6" rx="2" fill="#B76EFF" />
    </Shell>
  );
}

// ─── 5. SPY — Stalk Wallet ──────────────────────────────────────────
export function GhostSpy({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Dark hoodie/mask over lower face */}
      <path d="M50 95 L50 135 C50 145, 60 150, 100 150 C140 150, 150 145, 150 135 L150 95 C150 95, 140 90, 100 90 C60 90, 50 95, 50 95Z" fill="#2A2A3A" opacity="0.85" />
      {/* Mask eye holes */}
      <ellipse cx={78} cy={88} rx={22} ry={16} fill="#1A1A2A" />
      <ellipse cx={126} cy={88} rx={22} ry={16} fill="#1A1A2A" />
      {/* Left eye — squinting suspiciously */}
      <ellipse cx={78} cy={88} rx={16} ry={10} fill="#FFFFFF" />
      <ellipse cx={80} cy={88} rx={8} ry={7} fill="#2D1B69" />
      <ellipse cx={82} cy={86} rx={4} ry={4} fill="#1A1040" />
      <ellipse cx={80} cy={84} rx={2} ry={1.5} fill="#FFFFFF" opacity="0.9" />
      {/* Right eye — slightly more open */}
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={87} rx={16} ry={12} fill="#FFFFFF" />
        <ellipse cx={128} cy={87} rx={9} ry={9} fill="#2D1B69" />
        <ellipse cx={130} cy={85} rx={5} ry={5} fill="#1A1040" />
        <ellipse cx={128} cy={82} rx={2.5} ry={2} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Hood pointed top */}
      <path d="M60 55 C70 30, 90 22, 100 20 C110 22, 130 30, 140 55" stroke="#2A2A3A" strokeWidth="3" fill="none" opacity="0.4" />
    </Shell>
  );
}

// ─── 6. FURIOUS — Bundle Detection ──────────────────────────────────
export function GhostAngry({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Angry red-tinted eyes */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={90} rx={18} ry={18} fill="#FFFFFF" />
        <ellipse cx={78} cy={90} rx={13} ry={13} fill="#CC2200" />
        <ellipse cx={80} cy={88} rx={7} ry={7} fill="#880000" />
        <ellipse cx={77} cy={85} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={90} rx={18} ry={18} fill="#FFFFFF" />
        <ellipse cx={126} cy={90} rx={13} ry={13} fill="#CC2200" />
        <ellipse cx={128} cy={88} rx={7} ry={7} fill="#880000" />
        <ellipse cx={125} cy={85} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Heavy furrowed eyebrows */}
      <path d="M54 68 C62 58, 78 60, 94 72" stroke="#5A1040" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M110 72 C126 60, 142 58, 150 68" stroke="#5A1040" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Gritted teeth frown */}
      <path d="M80 122 C88 114, 114 114, 122 122" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="90" y1="118" x2="90" y2="118" stroke="#FFFFFF" strokeWidth="2" />
      {/* Steam puffs */}
      <circle cx="42" cy="50" r="6" fill="#FF6B6B" opacity="0.35" className="animate-sparkle" />
      <circle cx="35" cy="40" r="4.5" fill="#FF6B6B" opacity="0.25" className="animate-sparkle-delayed" />
      <circle cx="160" cy="48" r="6" fill="#FF6B6B" opacity="0.35" className="animate-sparkle-delayed" />
      <circle cx="167" cy="38" r="4.5" fill="#FF6B6B" opacity="0.25" className="animate-sparkle-delayed-2" />
      {/* Warning triangle on forehead */}
      <path d="M100 38 L93 52 L107 52Z" fill="#FFD166" stroke="#CC8800" strokeWidth="1.5" />
      <text x="97" y="50" fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="10" fill="#CC8800">!</text>
    </Shell>
  );
}

// ─── 7. TELESCOPE — Wallet Watching ─────────────────────────────────
export function GhostWatching({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Left eye closed (squinting through telescope) */}
      <path d="M62 88 C70 82, 86 82, 94 88" stroke="#2D1B69" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Right eye — wide open, focused */}
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={86} rx={20} ry={22} fill="#FFFFFF" />
        <ellipse cx={126} cy={86} rx={14} ry={16} fill="#2D1B69" />
        <ellipse cx={129} cy={83} rx={8} ry={9} fill="#1A1040" />
        <ellipse cx={126} cy={80} rx={3.5} ry={3} fill="#FFFFFF" opacity="0.95" />
      </g>
      {/* Telescope — held by left arm */}
      <path d="M32 98 C22 90, 14 78, 8 64" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Telescope barrel */}
      <rect x="-10" y="42" width="40" height="14" rx="4" fill="#5A3A8A" transform="rotate(-25, 10, 49)" />
      <rect x="-14" y="44" width="14" height="10" rx="3" fill="#7B4FBF" transform="rotate(-25, -7, 49)" />
      {/* Lens glint */}
      <circle cx="-4" cy="45" r="5" fill="#89CFF0" opacity="0.3" transform="rotate(-25, -4, 45)" />
      {/* Telescope rim */}
      <ellipse cx={-6} cy={46} rx={6} ry={5} stroke="#4A2A7A" strokeWidth="2" fill="none" transform="rotate(-25, -6, 46)" />
      {/* Focused small mouth */}
      <ellipse cx={102} cy={120} rx={7} ry={5} fill="#7B2FE0" />
      {/* Captain hat */}
      <ellipse cx={100} cy={28} rx={42} ry={6} fill="#1A1A5A" />
      <path d="M62 28 C62 14, 80 5, 100 5 C120 5, 138 14, 138 28" fill="#1A1A8A" />
      <rect x="68" y="22" width="64" height="4" rx="1" fill="#FFD166" />
      {/* Anchor emblem */}
      <circle cx="100" cy="15" r="4" fill="#FFD166" opacity="0.8" />
    </Shell>
  );
}

// ─── 8. NERDY — Transaction Decoder ─────────────────────────────────
export function GhostNerdy({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Eyes behind thick round glasses */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={88} rx={12} ry={14} fill="#FFFFFF" />
        <ellipse cx={78} cy={88} rx={8} ry={10} fill="#2D1B69" />
        <ellipse cx={79} cy={85} rx={5} ry={5} fill="#1A1040" />
        <ellipse cx={77} cy={82} rx={2.5} ry={2} fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={88} rx={12} ry={14} fill="#FFFFFF" />
        <ellipse cx={126} cy={88} rx={8} ry={10} fill="#2D1B69" />
        <ellipse cx={127} cy={85} rx={5} ry={5} fill="#1A1040" />
        <ellipse cx={125} cy={82} rx={2.5} ry={2} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Thick round glasses frame */}
      <circle cx={78} cy={88} r={22} stroke="#2A2A2A" strokeWidth="4" fill="none" />
      <circle cx={126} cy={88} r={22} stroke="#2A2A2A" strokeWidth="4" fill="none" />
      {/* Bridge */}
      <path d="M98 86 C100 82, 104 82, 106 86" stroke="#2A2A2A" strokeWidth="3.5" fill="none" />
      {/* Temple arms to ears */}
      <path d="M56 84 L38 78" stroke="#2A2A2A" strokeWidth="3" strokeLinecap="round" />
      <path d="M148 84 L166 78" stroke="#2A2A2A" strokeWidth="3" strokeLinecap="round" />
      {/* Lens glint */}
      <path d="M66 78 C70 74, 76 74, 80 76" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M116 78 C120 74, 126 74, 130 76" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Bowtie */}
      <path d="M90 135 L100 130 L110 135 L100 140Z" fill="#9945FF" />
      <circle cx="100" cy="135" r="3" fill="#B76EFF" />
      {/* Pleased little smile */}
      <path d="M90 116 C96 122, 106 122, 112 116" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Shell>
  );
}

// ─── 9. BELL RINGER — Smart Alerts ──────────────────────────────────
export function GhostBellRinger({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      <Eye cx={78} cy={88} className="ghost-eye-left" />
      <Eye cx={126} cy={88} className="ghost-eye-right" />
      {/* Excited open mouth */}
      <path d="M84 116 C90 128, 112 128, 118 116" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Right arm holding bell high */}
      <path d="M168 100 C178 88, 184 72, 180 55" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="180" cy="52" r="5" fill="#9945FF" />
      {/* Detailed bell */}
      <path d="M168 40 C164 40, 160 46, 160 54 L160 58 C160 60, 162 62, 164 62 L196 62 C198 62, 200 60, 200 58 L200 54 C200 46, 196 40, 192 40Z" fill="#FFD166" />
      {/* Bell body gradient stripe */}
      <path d="M164 48 L196 48" stroke="#FFBF00" strokeWidth="1.5" opacity="0.5" />
      {/* Bell lip (bottom rim) */}
      <rect x="158" y="60" width="44" height="4" rx="2" fill="#E6A800" />
      {/* Clapper */}
      <line x1="180" y1="62" x2="180" y2="70" stroke="#CC8800" strokeWidth="2" />
      <circle cx="180" cy="72" r="3.5" fill="#CC8800" />
      {/* Bell top */}
      <rect x="176" y="34" width="8" height="8" rx="4" fill="#E6A800" />
      {/* Sound wave arcs */}
      <path d="M204 42 C208 38, 210 34" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-sparkle" />
      <path d="M206 50 C210 47, 214 44" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" opacity="0.4" className="animate-sparkle-delayed" />
      <path d="M205 58 C210 56, 214 54" stroke="#FFD166" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" className="animate-sparkle-delayed-2" />
    </Shell>
  );
}

// ─── 10. HEART EYES — Token Sniping ─────────────────────────────────
export function GhostHungry({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Heart-shaped eyes */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={86} rx={20} ry={22} fill="#FFFFFF" />
        <path d="M68 82 C68 74, 78 72, 78 80 C78 72, 88 74, 88 82 C88 92, 78 96, 78 96 C78 96, 68 92, 68 82Z" fill="#FF4D6A" />
        <ellipse cx={75} cy={79} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.6" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={86} rx={20} ry={22} fill="#FFFFFF" />
        <path d="M116 82 C116 74, 126 72, 126 80 C126 72, 136 74, 136 82 C136 92, 126 96, 126 96 C126 96, 116 92, 116 82Z" fill="#FF4D6A" />
        <ellipse cx={123} cy={79} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.6" />
      </g>
      {/* Open mouth with tongue drooling */}
      <ellipse cx={102} cy={122} rx={14} ry={10} fill="#7B2FE0" />
      <ellipse cx={102} cy={127} rx={9} ry={7} fill="#FF8FCE" />
      {/* Drool drop */}
      <ellipse cx={112} cy={138} rx={3} ry={5} fill="#89CFF0" opacity="0.5" className="animate-sparkle" />
      {/* Floating hearts */}
      <path d="M150 50 C150 46, 154 45, 154 48 C154 45, 158 46, 158 50 C158 54, 154 56, 154 56 C154 56, 150 54, 150 50Z" fill="#FF4D6A" opacity="0.5" className="animate-sparkle" />
      <path d="M44 55 C44 52, 47 51, 47 53 C47 51, 50 52, 50 55 C50 58, 47 59, 47 59 C47 59, 44 58, 44 55Z" fill="#FF4D6A" opacity="0.4" className="animate-sparkle-delayed" />
    </Shell>
  );
}

// ─── 11. FORTUNE TELLER — Prediction Markets ────────────────────────
export function GhostFortuneTeller({ className = "" }: { className?: string }) {
  return (
    <Shell className={className} vb="-5 -15 210 250">
      {/* Turban/headwrap */}
      <path d="M55 35 C55 10, 80 -5, 102 -5 C124 -5, 148 10, 148 35 C148 38, 145 40, 100 40 C55 40, 55 38, 55 35Z" fill="#4A1A8A" />
      <path d="M60 30 C65 15, 85 5, 102 5 C119 5, 138 15, 143 30" fill="#5A2A9A" />
      {/* Turban folds */}
      <path d="M70 20 C80 12, 95 8, 102 8 C109 8, 124 12, 134 20" stroke="#7B3FBF" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M75 28 C85 22, 95 18, 102 18 C109 18, 119 22, 129 28" stroke="#7B3FBF" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Gem on forehead */}
      <path d="M102 32 L97 38 L102 44 L107 38Z" fill="#14F195" />
      <path d="M102 34 L99 38 L102 42 L105 38Z" fill="#FFFFFF" opacity="0.4" />
      {/* Mystical eyes looking up */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={88} rx={18} ry={20} fill="#FFFFFF" />
        <ellipse cx={78} cy={86} rx={12} ry={14} fill="#4A1A8A" />
        <ellipse cx={76} cy={82} rx={7} ry={8} fill="#2A0A5A" />
        <ellipse cx={74} cy={79} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={88} rx={18} ry={20} fill="#FFFFFF" />
        <ellipse cx={126} cy={86} rx={12} ry={14} fill="#4A1A8A" />
        <ellipse cx={124} cy={82} rx={7} ry={8} fill="#2A0A5A" />
        <ellipse cx={122} cy={79} rx={3} ry={2.5} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Knowing mysterious smile */}
      <path d="M88 118 C94 124, 108 124, 114 118" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Sparkle particles */}
      <circle cx="48" cy="58" r="2" fill="#FFD166" opacity="0.5" className="animate-sparkle" />
      <circle cx="156" cy="55" r="1.5" fill="#14F195" opacity="0.4" className="animate-sparkle-delayed" />
      <circle cx="44" cy="75" r="1.5" fill="#FF8FCE" opacity="0.4" className="animate-sparkle-delayed-2" />
      {/* Stars around turban */}
      <path d="M50 15 L52 20 L57 20 L53 23 L55 28 L50 25 L45 28 L47 23 L43 20 L48 20Z" fill="#FFD166" opacity="0.5" className="animate-sparkle" />
      <path d="M152 12 L153 16 L157 16 L154 18 L155 22 L152 20 L149 22 L150 18 L147 16 L151 16Z" fill="#14F195" opacity="0.4" className="animate-sparkle-delayed" />
    </Shell>
  );
}

// ─── 12. ROCKET — Send Crypto ───────────────────────────────────────
export function GhostRocket({ className = "" }: { className?: string }) {
  return (
    <Shell className={className}>
      {/* Aviator goggles pushed up on forehead */}
      <ellipse cx={80} cy={52} rx={16} ry={10} stroke="#8B6914" strokeWidth="2.5" fill="rgba(200,220,255,0.25)" />
      <ellipse cx={124} cy={52} rx={16} ry={10} stroke="#8B6914" strokeWidth="2.5" fill="rgba(200,220,255,0.25)" />
      <path d="M96 52 L108 52" stroke="#8B6914" strokeWidth="2.5" />
      {/* Goggle strap */}
      <path d="M64 52 C55 48, 45 50, 40 55" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M140 52 C149 48, 159 50, 164 55" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Lens reflection */}
      <path d="M72 48 C76 44, 82 44, 86 46" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Determined eyes */}
      <g className="ghost-eye-left">
        <ellipse cx={78} cy={88} rx={18} ry={20} fill="#FFFFFF" />
        <ellipse cx={78} cy={88} rx={12} ry={14} fill="#2D1B69" />
        <ellipse cx={80} cy={85} rx={7} ry={8} fill="#1A1040" />
        <ellipse cx={77} cy={82} rx={3.5} ry={3} fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx={126} cy={88} rx={18} ry={20} fill="#FFFFFF" />
        <ellipse cx={126} cy={88} rx={12} ry={14} fill="#2D1B69" />
        <ellipse cx={128} cy={85} rx={7} ry={8} fill="#1A1040" />
        <ellipse cx={125} cy={82} rx={3.5} ry={3} fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Determined grin */}
      <path d="M84 116 C92 128, 112 128, 118 116" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Scarf trailing to the right */}
      <path d="M140 110 C155 108, 168 115, 178 108 C188 101, 192 108, 198 104" stroke="#FF4D6A" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M140 116 C155 114, 168 120, 176 114" stroke="#FF4D6A" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Rocket flames at bottom */}
      <path d="M75 165 C78 172, 82 180, 80 190" stroke="#FF6B35" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" className="animate-sparkle" />
      <path d="M100 168 C100 178, 100 188, 100 198" stroke="#FFD166" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.9" className="animate-sparkle-delayed" />
      <path d="M125 165 C122 172, 118 180, 120 190" stroke="#FF6B35" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" className="animate-sparkle-delayed-2" />
      {/* Speed lines */}
      <line x1="45" y1="140" x2="25" y2="160" stroke="#B76EFF" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="155" y1="140" x2="175" y2="160" stroke="#B76EFF" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="40" y1="125" x2="22" y2="140" stroke="#B76EFF" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="160" y1="125" x2="178" y2="140" stroke="#B76EFF" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    </Shell>
  );
}

// ─── HERO & FOOTER & NAV ────────────────────────────────────────────

export function GhostWaving({ className = "" }: { className?: string }) {
  return (
    <svg width="200" height="220" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="130" cy="120" rx="80" ry="75" fill="#9945FF" opacity="0.05" />
      <path d="M130 40 C90 40, 62 72, 62 110 L62 168 C62 173, 68 177, 76 172 C83 168, 88 173, 94 178 C100 183, 105 178, 110 173 C116 168, 121 173, 127 178 C133 183, 138 178, 143 173 C149 168, 154 173, 160 178 C166 183, 171 178, 176 173 C182 168, 188 173, 195 178 C202 173, 198 168, 198 163 L198 110 C198 72, 170 40, 130 40Z" fill="#9945FF" />
      <path d="M95 55 C80 70, 72 92, 72 110" stroke="#B76EFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3" />
      <g className="ghost-eye-left">
        <ellipse cx="108" cy="100" rx="20" ry="22" fill="#FFFFFF" />
        <ellipse cx="108" cy="100" rx="14" ry="16" fill="#2D1B69" />
        <ellipse cx="111" cy="97" rx="8" ry="9" fill="#1A1040" />
        <ellipse cx="107" cy="93" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="152" cy="100" rx="20" ry="22" fill="#FFFFFF" />
        <ellipse cx="152" cy="100" rx="14" ry="16" fill="#2D1B69" />
        <ellipse cx="155" cy="97" rx="8" ry="9" fill="#1A1040" />
        <ellipse cx="151" cy="93" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      </g>
      <ellipse cx="130" cy="130" rx="13" ry="9" fill="#7B2FE0" />
      <ellipse cx="130" cy="127" rx="11" ry="4.5" fill="#FFFFFF" opacity="0.4" />
      <ellipse cx="90" cy="116" rx="11" ry="6" fill="#FF8FCE" opacity="0.3" />
      <ellipse cx="170" cy="116" rx="11" ry="6" fill="#FF8FCE" opacity="0.3" />
      <path d="M62 100 C50 88, 38 68, 32 52" stroke="#9945FF" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="48" r="7" fill="#9945FF" />
      <path d="M198 105 C210 98, 220 85, 222 72" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="223" cy="69" r="6" fill="#9945FF" />
      <circle cx="20" cy="30" r="3.5" fill="#FFD166" opacity="0.55" className="animate-sparkle" />
      <circle cx="240" cy="50" r="3" fill="#FFD166" opacity="0.45" className="animate-sparkle-delayed" />
      <circle cx="38" cy="38" r="2" fill="#FF8FCE" opacity="0.35" className="animate-sparkle-delayed-2" />
    </svg>
  );
}

export function GhostCelebrating({ className = "" }: { className?: string }) {
  return (
    <svg width="90" height="105" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M130 50 C90 50, 64 82, 64 118 L64 172 C64 177, 70 181, 78 176 C85 172, 90 177, 96 182 C102 187, 107 182, 112 177 C118 172, 123 177, 129 182 C135 187, 140 182, 145 177 C151 172, 156 177, 162 182 C168 187, 173 182, 178 177 C184 172, 190 177, 197 182 C204 177, 200 172, 200 167 L200 118 C200 82, 172 50, 130 50Z" fill="#9945FF" />
      <g className="ghost-eye-left">
        <ellipse cx="108" cy="108" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="108" cy="108" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="111" cy="105" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="107" cy="102" rx="3.5" ry="3" fill="#FFFFFF" opacity="0.95" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="152" cy="108" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="152" cy="108" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="155" cy="105" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="151" cy="102" rx="3.5" ry="3" fill="#FFFFFF" opacity="0.95" />
      </g>
      <ellipse cx="130" cy="135" rx="12" ry="8.5" fill="#7B2FE0" />
      <ellipse cx="130" cy="132" rx="10" ry="4" fill="#FFFFFF" opacity="0.4" />
      <ellipse cx="90" cy="122" rx="10" ry="5.5" fill="#FF8FCE" opacity="0.3" />
      <ellipse cx="170" cy="122" rx="10" ry="5.5" fill="#FF8FCE" opacity="0.3" />
      <path d="M64 108 C50 92, 38 72, 32 55" stroke="#9945FF" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="51" r="7" fill="#9945FF" />
      <path d="M200 108 C214 92, 226 72, 232 55" stroke="#9945FF" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="234" cy="51" r="7" fill="#9945FF" />
      <circle cx="22" cy="32" r="3.5" fill="#FFD166" opacity="0.6" className="animate-sparkle" />
      <circle cx="242" cy="30" r="3" fill="#FF8FCE" opacity="0.55" className="animate-sparkle-delayed" />
      <circle cx="40" cy="20" r="2.5" fill="#14F195" opacity="0.5" className="animate-sparkle-delayed-2" />
      <path d="M55 12 L57 18 L63 18 L58 22 L60 28 L55 24 L50 28 L52 22 L47 18 L53 18Z" fill="#FFD166" opacity="0.4" className="animate-sparkle-delayed" />
      <path d="M205 10 L207 16 L213 16 L208 20 L210 26 L205 22 L200 26 L202 20 L197 16 L203 16Z" fill="#FF8FCE" opacity="0.35" className="animate-sparkle-delayed-2" />
    </svg>
  );
}

export function GhostNavLogo() {
  return (
    <svg width="28" height="30" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C58 161, 64 166, 80 161 C97 166, 113 161, 146 161 C165 166, 168 150, 168 98 C168 58, 140 25, 100 25Z" fill="#9945FF" />
      <ellipse cx="74" cy="88" rx="18" ry="20" fill="#FFFFFF" />
      <ellipse cx="74" cy="88" rx="10" ry="12" fill="#2D1B69" />
      <ellipse cx="72" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
      <ellipse cx="126" cy="88" rx="10" ry="12" fill="#2D1B69" />
      <ellipse cx="124" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      <path d="M85 110 C90 118, 110 118, 115 110" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
