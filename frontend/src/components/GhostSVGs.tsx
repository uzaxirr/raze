// Ghost mascot SVGs with unique emotions for each feature slide

// Shared ghost body path
const GHOST_BODY = "M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C53 156, 58 161, 64 166 C70 171, 75 166, 80 161 C86 156, 91 161, 97 166 C103 171, 108 166, 113 161 C119 156, 124 161, 130 166 C136 171, 141 166, 146 161 C152 156, 158 161, 165 166 C172 161, 168 155, 168 150 L168 98 C168 58, 140 25, 100 25Z";

function GhostShell({ children, className = "", w = 160, h = 170 }: { children: React.ReactNode; className?: string; w?: number; h?: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d={GHOST_BODY} fill="#9945FF" />
      <path d="M65 40 C50 55, 42 78, 42 98" stroke="#B76EFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.3" />
      {children}
      {/* Blush */}
      <ellipse cx="64" cy="106" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
      <ellipse cx="140" cy="106" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
    </svg>
  );
}

// 1. Dollar Eyes — Check Balance
export function GhostDollarEyes({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <ellipse cx="78" cy="88" rx="20" ry="22" fill="#FFFFFF" />
      <ellipse cx="78" cy="88" rx="14" ry="16" fill="#14A86C" />
      <text x="72" y="95" fontFamily="Space Grotesk" fontWeight="800" fontSize="22" fill="#FFFFFF">$</text>
      <ellipse cx="126" cy="88" rx="20" ry="22" fill="#FFFFFF" />
      <ellipse cx="126" cy="88" rx="14" ry="16" fill="#14A86C" />
      <text x="120" y="95" fontFamily="Space Grotesk" fontWeight="800" fontSize="22" fill="#FFFFFF">$</text>
      <path d="M88 118 C94 127, 106 127, 112 118" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 2. Shocked/Alert — Security
export function GhostAlert({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="85" rx="22" ry="26" fill="#FFFFFF" />
        <ellipse cx="78" cy="85" rx="15" ry="19" fill="#2D1B69" />
        <ellipse cx="80" cy="82" rx="9" ry="10" fill="#1A1040" />
        <ellipse cx="77" cy="78" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="85" rx="22" ry="26" fill="#FFFFFF" />
        <ellipse cx="126" cy="85" rx="15" ry="19" fill="#2D1B69" />
        <ellipse cx="128" cy="82" rx="9" ry="10" fill="#1A1040" />
        <ellipse cx="125" cy="78" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      </g>
      <ellipse cx="102" cy="118" rx="10" ry="9" fill="#7B2FE0" />
    </GhostShell>
  );
}

// 3. Detective — Token Autopsies (magnifying glass monocle)
export function GhostDetective({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Left eye normal */}
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="78" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="76" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Right eye with monocle */}
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="126" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="124" cy="84" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Monocle ring */}
      <circle cx="126" cy="88" r="24" stroke="#FFD166" strokeWidth="3" fill="none" />
      <line x1="145" y1="105" x2="158" y2="130" stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round" />
      {/* Slight smirk */}
      <path d="M88 115 C94 122, 108 120, 112 114" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 4. Winking — Instant Swaps
export function GhostWinking({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Left eye open */}
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="78" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="80" cy="85" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="77" cy="82" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Right eye winking (closed arc) */}
      <path d="M114 88 C118 82, 128 82, 138 88" stroke="#2D1B69" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Thumbs up arm */}
      <path d="M168 105 C180 98, 185 85, 182 72" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="182" cy="68" r="6" fill="#9945FF" />
      {/* Thumb up indicator */}
      <line x1="182" y1="62" x2="182" y2="52" stroke="#9945FF" strokeWidth="4" strokeLinecap="round" />
      {/* Grin */}
      <path d="M85 115 C92 126, 110 126, 116 115" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 5. Spy — Stalk Wallet (squinting one eye)
export function GhostSpy({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Left eye squinting */}
      <ellipse cx="78" cy="88" rx="18" ry="12" fill="#FFFFFF" />
      <ellipse cx="78" cy="88" rx="12" ry="8" fill="#2D1B69" />
      <ellipse cx="80" cy="86" rx="6" ry="5" fill="#1A1040" />
      {/* Right eye wide open (peering) */}
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="86" rx="22" ry="24" fill="#FFFFFF" />
        <ellipse cx="126" cy="86" rx="15" ry="18" fill="#2D1B69" />
        <ellipse cx="130" cy="84" rx="9" ry="10" fill="#1A1040" />
        <ellipse cx="128" cy="80" rx="4" ry="3" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Eyebrow raised */}
      <path d="M110 62 C118 56, 134 56, 142 62" stroke="#7B2FE0" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Sly smile */}
      <path d="M88 116 C94 120, 106 120, 112 114" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 6. Angry/Warning — Bundle Detection (furrowed brows)
export function GhostAngry({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="90" rx="18" ry="18" fill="#FFFFFF" />
        <ellipse cx="78" cy="90" rx="12" ry="13" fill="#CC0000" />
        <ellipse cx="80" cy="88" rx="7" ry="7" fill="#880000" />
        <ellipse cx="77" cy="85" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="90" rx="18" ry="18" fill="#FFFFFF" />
        <ellipse cx="126" cy="90" rx="12" ry="13" fill="#CC0000" />
        <ellipse cx="128" cy="88" rx="7" ry="7" fill="#880000" />
        <ellipse cx="125" cy="85" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Angry eyebrows */}
      <path d="M58 72 C68 64, 82 68, 92 76" stroke="#7B2FE0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M112 76 C122 68, 136 64, 146 72" stroke="#7B2FE0" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Frown */}
      <path d="M88 122 C94 116, 108 116, 114 122" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 7. Watching — Wallet Watching (binocular eyes)
export function GhostWatching({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Binocular-style large round eyes */}
      <circle cx="78" cy="86" r="22" fill="#FFFFFF" />
      <circle cx="78" cy="86" r="16" fill="#2D1B69" />
      <circle cx="78" cy="86" r="10" fill="#1A1040" />
      <circle cx="75" cy="82" r="4" fill="#FFFFFF" opacity="0.9" />
      <circle cx="126" cy="86" r="22" fill="#FFFFFF" />
      <circle cx="126" cy="86" r="16" fill="#2D1B69" />
      <circle cx="126" cy="86" r="10" fill="#1A1040" />
      <circle cx="123" cy="82" r="4" fill="#FFFFFF" opacity="0.9" />
      {/* Bridge between eyes (binocular connection) */}
      <rect x="96" y="80" width="12" height="12" rx="3" fill="#7B2FE0" opacity="0.5" />
      {/* Small O mouth (focused) */}
      <ellipse cx="102" cy="118" rx="7" ry="6" fill="#7B2FE0" />
    </GhostShell>
  );
}

// 8. Nerdy — Transaction Decoder (code bracket eyes)
export function GhostNerdy({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Glasses frame */}
      <rect x="56" y="72" width="44" height="34" rx="8" stroke="#FFD166" strokeWidth="3" fill="white" />
      <rect x="106" y="72" width="44" height="34" rx="8" stroke="#FFD166" strokeWidth="3" fill="white" />
      <line x1="100" y1="89" x2="106" y2="89" stroke="#FFD166" strokeWidth="3" />
      {/* Eyes inside glasses */}
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="89" rx="10" ry="11" fill="#2D1B69" />
        <ellipse cx="80" cy="87" rx="5" ry="6" fill="#1A1040" />
        <ellipse cx="77" cy="84" rx="2.5" ry="2" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="128" cy="89" rx="10" ry="11" fill="#2D1B69" />
        <ellipse cx="130" cy="87" rx="5" ry="6" fill="#1A1040" />
        <ellipse cx="127" cy="84" rx="2.5" ry="2" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Code brackets on cheeks */}
      <text x="44" y="125" fontFamily="JetBrains Mono" fontSize="18" fill="#FFFFFF" opacity="0.5">{"{"}</text>
      <text x="148" y="125" fontFamily="JetBrains Mono" fontSize="18" fill="#FFFFFF" opacity="0.5">{"}"}</text>
      {/* Neutral focused mouth */}
      <path d="M90 118 C96 122, 106 122, 112 118" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 9. Bell Ringer — Smart Alerts (arm holding bell)
export function GhostBellRinger({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="78" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="80" cy="85" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="77" cy="82" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="126" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="128" cy="85" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="125" cy="82" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Arm holding bell */}
      <path d="M168 100 C178 90, 182 75, 178 60" stroke="#9945FF" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Bell */}
      <path d="M170 55 C165 55, 162 62, 162 68 L190 68 C190 62, 187 55, 182 55Z" fill="#FFD166" />
      <circle cx="176" cy="72" r="3" fill="#FFD166" />
      <rect x="172" y="48" width="8" height="8" rx="4" fill="#FFD166" />
      {/* Sound lines */}
      <path d="M195 52 C198 50, 200 48" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" opacity="0.6" className="animate-sparkle" />
      <path d="M196 60 C200 58, 202 57" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" opacity="0.4" className="animate-sparkle-delayed" />
      {/* Excited smile */}
      <path d="M85 115 C92 126, 110 126, 116 115" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </GhostShell>
  );
}

// 10. Hungry — Token Sniping (tongue out, hungry eyes)
export function GhostHungry({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      {/* Star eyes (excited/hungry) */}
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="86" rx="20" ry="22" fill="#FFFFFF" />
        <polygon points="78,70 82,82 94,82 84,90 88,102 78,94 68,102 72,90 62,82 74,82" fill="#14F195" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="86" rx="20" ry="22" fill="#FFFFFF" />
        <polygon points="126,70 130,82 142,82 132,90 136,102 126,94 116,102 120,90 110,82 122,82" fill="#14F195" />
      </g>
      {/* Open mouth with tongue */}
      <ellipse cx="102" cy="120" rx="14" ry="10" fill="#7B2FE0" />
      <ellipse cx="102" cy="126" rx="8" ry="6" fill="#FF8FCE" />
    </GhostShell>
  );
}

// 11. Fortune Teller — Prediction Markets (crystal ball)
export function GhostFortuneTeller({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="78" cy="88" rx="12" ry="14" fill="#2D1B69" />
        {/* Eyes looking up (mystical) */}
        <ellipse cx="76" cy="82" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="74" cy="79" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="126" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="124" cy="82" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="122" cy="79" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Mystical smile */}
      <path d="M88 116 C94 122, 108 122, 112 116" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Crystal ball floating above */}
      <circle cx="102" cy="18" r="16" fill="#B76EFF" opacity="0.3" />
      <circle cx="102" cy="18" r="12" fill="#9945FF" opacity="0.2" />
      <circle cx="102" cy="18" r="8" fill="#FFFFFF" opacity="0.15" className="animate-sparkle" />
      {/* Sparkle particles around ball */}
      <circle cx="86" cy="8" r="2" fill="#FFD166" opacity="0.6" className="animate-sparkle" />
      <circle cx="118" cy="6" r="1.5" fill="#FF8FCE" opacity="0.5" className="animate-sparkle-delayed" />
      <circle cx="90" cy="28" r="1.5" fill="#14F195" opacity="0.5" className="animate-sparkle-delayed-2" />
    </GhostShell>
  );
}

// 12. Rocket — Send Crypto (blasting off)
export function GhostRocket({ className = "" }: { className?: string }) {
  return (
    <GhostShell className={className}>
      <g className="ghost-eye-left">
        <ellipse cx="78" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="78" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="80" cy="85" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="77" cy="82" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      <g className="ghost-eye-right">
        <ellipse cx="126" cy="88" rx="18" ry="20" fill="#FFFFFF" />
        <ellipse cx="126" cy="88" rx="12" ry="14" fill="#2D1B69" />
        <ellipse cx="128" cy="85" rx="7" ry="8" fill="#1A1040" />
        <ellipse cx="125" cy="82" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>
      {/* Determined grin */}
      <path d="M85 115 C92 126, 110 126, 116 115" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Rocket flames at bottom */}
      <ellipse cx="80" cy="170" rx="8" ry="14" fill="#FF6B35" opacity="0.7" className="animate-sparkle" />
      <ellipse cx="100" cy="175" rx="10" ry="18" fill="#FFD166" opacity="0.8" className="animate-sparkle-delayed" />
      <ellipse cx="120" cy="170" rx="8" ry="14" fill="#FF6B35" opacity="0.7" className="animate-sparkle-delayed-2" />
      {/* Speed lines */}
      <line x1="45" y1="145" x2="30" y2="165" stroke="#B76EFF" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="155" y1="145" x2="170" y2="165" stroke="#B76EFF" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="50" y1="130" x2="32" y2="145" stroke="#B76EFF" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    </GhostShell>
  );
}

// === Hero & Footer ghosts (unchanged) ===

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
      <circle cx="220" cy="18" r="2.5" fill="#9945FF" opacity="0.4" className="animate-sparkle" />
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
