// Ghost mascot SVGs with different emotions for each section

export function GhostWaving({ className = "" }: { className?: string }) {
  return (
    <svg
      width="200"
      height="220"
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="130" cy="120" rx="80" ry="75" fill="#9945FF" opacity="0.05" />
      <path
        d="M130 40 C90 40, 62 72, 62 110 L62 168 C62 173, 68 177, 76 172 C83 168, 88 173, 94 178 C100 183, 105 178, 110 173 C116 168, 121 173, 127 178 C133 183, 138 178, 143 173 C149 168, 154 173, 160 178 C166 183, 171 178, 176 173 C182 168, 188 173, 195 178 C202 173, 198 168, 198 163 L198 110 C198 72, 170 40, 130 40Z"
        fill="#9945FF"
      />
      <path
        d="M95 55 C80 70, 72 92, 72 110"
        stroke="#B76EFF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Left eye - blinks */}
      <g className="ghost-eye-left">
        <ellipse cx="108" cy="100" rx="20" ry="22" fill="#FFFFFF" />
        <ellipse cx="108" cy="100" rx="14" ry="16" fill="#2D1B69" />
        <ellipse cx="111" cy="97" rx="8" ry="9" fill="#1A1040" />
        <ellipse cx="107" cy="93" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      </g>
      {/* Right eye - blinks */}
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
      {/* Left arm waving */}
      <path
        d="M62 100 C50 88, 38 68, 32 52"
        stroke="#9945FF"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="48" r="7" fill="#9945FF" />
      {/* Right arm waving */}
      <path
        d="M198 105 C210 98, 220 85, 222 72"
        stroke="#9945FF"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="223" cy="69" r="6" fill="#9945FF" />
      {/* Sparkles */}
      <circle cx="20" cy="30" r="3.5" fill="#FFD166" opacity="0.55" className="animate-sparkle" />
      <circle cx="240" cy="50" r="3" fill="#FFD166" opacity="0.45" className="animate-sparkle-delayed" />
      <circle cx="38" cy="38" r="2" fill="#FF8FCE" opacity="0.35" className="animate-sparkle-delayed-2" />
    </svg>
  );
}

export function GhostCelebrating({ className = "" }: { className?: string }) {
  return (
    <svg
      width="90"
      height="105"
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M130 50 C90 50, 64 82, 64 118 L64 172 C64 177, 70 181, 78 176 C85 172, 90 177, 96 182 C102 187, 107 182, 112 177 C118 172, 123 177, 129 182 C135 187, 140 182, 145 177 C151 172, 156 177, 162 182 C168 187, 173 182, 178 177 C184 172, 190 177, 197 182 C204 177, 200 172, 200 167 L200 118 C200 82, 172 50, 130 50Z"
        fill="#9945FF"
      />
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
      {/* Both arms raised */}
      <path d="M64 108 C50 92, 38 72, 32 55" stroke="#9945FF" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="51" r="7" fill="#9945FF" />
      <path d="M200 108 C214 92, 226 72, 232 55" stroke="#9945FF" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="234" cy="51" r="7" fill="#9945FF" />
      {/* Sparkles */}
      <circle cx="22" cy="32" r="3.5" fill="#FFD166" opacity="0.6" className="animate-sparkle" />
      <circle cx="242" cy="30" r="3" fill="#FF8FCE" opacity="0.55" className="animate-sparkle-delayed" />
      <circle cx="40" cy="20" r="2.5" fill="#14F195" opacity="0.5" className="animate-sparkle-delayed-2" />
      <circle cx="220" cy="18" r="2.5" fill="#9945FF" opacity="0.4" className="animate-sparkle" />
      {/* Stars */}
      <path d="M55 12 L57 18 L63 18 L58 22 L60 28 L55 24 L50 28 L52 22 L47 18 L53 18Z" fill="#FFD166" opacity="0.4" className="animate-sparkle-delayed" />
      <path d="M205 10 L207 16 L213 16 L208 20 L210 26 L205 22 L200 26 L202 20 L197 16 L203 16Z" fill="#FF8FCE" opacity="0.35" className="animate-sparkle-delayed-2" />
    </svg>
  );
}

export function GhostDollarEyes({ className = "" }: { className?: string }) {
  return (
    <svg
      width="160"
      height="170"
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C53 156, 58 161, 64 166 C70 171, 75 166, 80 161 C86 156, 91 161, 97 166 C103 171, 108 166, 113 161 C119 156, 124 161, 130 166 C136 171, 141 166, 146 161 C152 156, 158 161, 165 166 C172 161, 168 155, 168 150 L168 98 C168 58, 140 25, 100 25Z"
        fill="#9945FF"
      />
      <path d="M65 40 C50 55, 42 78, 42 98" stroke="#B76EFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.3" />
      <ellipse cx="78" cy="88" rx="20" ry="22" fill="#FFFFFF" />
      <ellipse cx="78" cy="88" rx="14" ry="16" fill="#14A86C" />
      <text x="72" y="95" fontFamily="Space Grotesk" fontWeight="800" fontSize="22" fill="#FFFFFF">$</text>
      <ellipse cx="126" cy="88" rx="20" ry="22" fill="#FFFFFF" />
      <ellipse cx="126" cy="88" rx="14" ry="16" fill="#14A86C" />
      <text x="120" y="95" fontFamily="Space Grotesk" fontWeight="800" fontSize="22" fill="#FFFFFF">$</text>
      <path d="M88 118 C94 127, 106 127, 112 118" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="64" cy="106" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
      <ellipse cx="140" cy="106" rx="10" ry="5" fill="#FF8FCE" opacity="0.3" />
    </svg>
  );
}

export function GhostAlert({ className = "" }: { className?: string }) {
  return (
    <svg
      width="160"
      height="170"
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C53 156, 58 161, 64 166 C70 171, 75 166, 80 161 C86 156, 91 161, 97 166 C103 171, 108 166, 113 161 C119 156, 124 161, 130 166 C136 171, 141 166, 146 161 C152 156, 158 161, 165 166 C172 161, 168 155, 168 150 L168 98 C168 58, 140 25, 100 25Z"
        fill="#9945FF"
      />
      {/* Wide shocked eyes */}
      <ellipse cx="78" cy="85" rx="22" ry="26" fill="#FFFFFF" />
      <ellipse cx="78" cy="85" rx="15" ry="19" fill="#2D1B69" />
      <ellipse cx="80" cy="82" rx="9" ry="10" fill="#1A1040" />
      <ellipse cx="77" cy="78" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      <ellipse cx="126" cy="85" rx="22" ry="26" fill="#FFFFFF" />
      <ellipse cx="126" cy="85" rx="15" ry="19" fill="#2D1B69" />
      <ellipse cx="128" cy="82" rx="9" ry="10" fill="#1A1040" />
      <ellipse cx="125" cy="78" rx="4" ry="3.5" fill="#FFFFFF" opacity="0.95" />
      {/* O mouth */}
      <ellipse cx="102" cy="118" rx="10" ry="9" fill="#7B2FE0" />
      <ellipse cx="60" cy="104" rx="10" ry="5.5" fill="#FF4545" opacity="0.25" />
      <ellipse cx="144" cy="104" rx="10" ry="5.5" fill="#FF4545" opacity="0.25" />
    </svg>
  );
}

export function GhostThinking({ className = "" }: { className?: string }) {
  return (
    <svg
      width="140"
      height="120"
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M100 10 C65 10, 40 38, 40 75 L40 130 C40 135, 46 138, 52 134 C58 130, 62 134, 68 138 C74 142, 78 138, 84 134 C90 130, 94 134, 100 138 C106 142, 110 138, 116 134 C122 130, 126 134, 132 138 C138 142, 142 138, 148 134 C154 130, 160 134, 166 138 C172 134, 168 130, 168 125 L168 75 C168 38, 143 10, 108 10Z"
        fill="#9945FF"
      />
      {/* Eyes looking up */}
      <ellipse cx="78" cy="65" rx="18" ry="20" fill="#FFFFFF" />
      <ellipse cx="78" cy="65" rx="12" ry="14" fill="#2D1B69" />
      <ellipse cx="75" cy="58" rx="7" ry="8" fill="#1A1040" />
      <ellipse cx="74" cy="56" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      <ellipse cx="126" cy="65" rx="18" ry="20" fill="#FFFFFF" />
      <ellipse cx="126" cy="65" rx="12" ry="14" fill="#2D1B69" />
      <ellipse cx="123" cy="58" rx="7" ry="8" fill="#1A1040" />
      <ellipse cx="122" cy="56" rx="3" ry="2.5" fill="#FFFFFF" opacity="0.9" />
      <path d="M90 92 C96 98, 108 98, 114 92" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="66" cy="84" rx="8" ry="4" fill="#FF8FCE" opacity="0.25" />
      <ellipse cx="138" cy="84" rx="8" ry="4" fill="#FF8FCE" opacity="0.25" />
      {/* Thought dots - animated pulse */}
      <circle cx="150" cy="28" r="6" fill="#9945FF" className="thought-dot-1" />
      <circle cx="162" cy="14" r="4.5" fill="#9945FF" className="thought-dot-2" />
      <circle cx="172" cy="4" r="3" fill="#9945FF" className="thought-dot-3" />
    </svg>
  );
}

export function GhostNavLogo() {
  return (
    <svg width="28" height="30" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C58 161, 64 166, 80 161 C97 166, 113 161, 146 161 C165 166, 168 150, 168 98 C168 58, 140 25, 100 25Z"
        fill="#9945FF"
      />
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
