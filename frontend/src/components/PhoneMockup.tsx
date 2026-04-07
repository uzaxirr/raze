// Reusable iPhone mockup component with Telegram-style chat screens

interface ChatMessage {
  type: "user" | "bot";
  content: React.ReactNode;
}

interface PhoneMockupProps {
  messages: ChatMessage[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function PhoneMockup({ messages, className = "", size = "md" }: PhoneMockupProps) {
  const sizes = {
    sm: { w: 230, h: 460, radius: 36, inner: 34, notch: 72, scale: "scale-100" },
    md: { w: 255, h: 510, radius: 40, inner: 38, notch: 78, scale: "scale-100" },
    lg: { w: 280, h: 560, radius: 44, inner: 42, notch: 84, scale: "scale-100" },
  };
  const s = sizes[size];

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{
        width: s.w,
        height: s.h,
        borderRadius: s.radius,
        padding: 3,
        background: "linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%)",
        boxShadow: "0 20px 60px rgba(80, 40, 180, 0.18)",
      }}
    >
      <div
        className="flex flex-col overflow-hidden relative"
        style={{
          width: s.w - 6,
          height: s.h - 6,
          borderRadius: s.inner,
          backgroundColor: "#000",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-end justify-between shrink-0"
          style={{ backgroundColor: "#517DA2", height: 52, paddingLeft: 22, paddingRight: 18 }}
        >
          <span className="text-white text-[12px] font-semibold font-sans" style={{ paddingBottom: 6, letterSpacing: "0.02em" }}>9:41</span>
          <div className="flex items-center gap-[3px]" style={{ paddingBottom: 7 }}>
            {/* Signal bars */}
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0">
              <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="#FFFFFF" />
              <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="#FFFFFF" />
              <rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="#FFFFFF" />
              <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#FFFFFF" />
            </svg>
            {/* WiFi */}
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="shrink-0">
              <path d="M6 9.5 C6.8 9.5 7.5 8.8 7.5 8 C7.5 7.2 6.8 6.5 6 6.5 C5.2 6.5 4.5 7.2 4.5 8 C4.5 8.8 5.2 9.5 6 9.5Z" fill="#FFFFFF" />
              <path d="M2.5 5.5 C3.5 4.2 4.6 3.5 6 3.5 C7.4 3.5 8.5 4.2 9.5 5.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M0.5 3 C2.2 1.2 4 0 6 0 C8 0 9.8 1.2 11.5 3" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
            {/* Battery */}
            <svg width="20" height="9" viewBox="0 0 25 12" fill="none" className="shrink-0">
              <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
              <rect x="2" y="2" width="14" height="8" rx="1.5" fill="#FFFFFF" />
              <path d="M22 4.5 C23 4.5 23.5 5 23.5 6 C23.5 7 23 7.5 22 7.5" fill="rgba(255,255,255,0.4)" />
            </svg>
          </div>
        </div>

        {/* Chat header */}
        <div
          className="flex items-center gap-[7px] px-3 pt-1 pb-2"
          style={{ backgroundColor: "#517DA2" }}
        >
          {/* Mini ghost avatar - white bg with purple ghost */}
          <div className="w-7 h-7 rounded-[14px] bg-white shrink-0 flex items-center justify-center overflow-hidden">
            <svg width="18" height="18" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 25 C60 25, 32 58, 32 98 L32 155 C32 161, 38 165, 46 160 C58 161, 64 166, 80 161 C97 166, 113 161, 146 161 C165 166, 168 150, 168 98 C168 58, 140 25, 100 25Z" fill="#9945FF" />
              <ellipse cx="74" cy="88" rx="14" ry="16" fill="#FFFFFF" />
              <ellipse cx="74" cy="88" rx="8" ry="10" fill="#2D1B69" />
              <ellipse cx="126" cy="88" rx="14" ry="16" fill="#FFFFFF" />
              <ellipse cx="126" cy="88" rx="8" ry="10" fill="#2D1B69" />
              <path d="M85 115 C90 122, 110 122, 115 115" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[13px] font-semibold font-sans leading-[15px]">Raze</span>
            <span className="text-white/60 text-[9px] font-sans leading-[11px]">online</span>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="flex flex-col gap-1.5 grow px-[7px] py-[9px]"
          style={{ backgroundColor: "#C8D9E6" }}
        >
          {messages.map((msg, i) =>
            msg.type === "user" ? (
              <div key={i} className="flex justify-end">
                <div
                  className="px-[9px] py-1.5 text-[12px] leading-[16px] font-sans text-[#1A1A1A]"
                  style={{
                    backgroundColor: "#EEFFDE",
                    borderRadius: "9px 3px 9px 9px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div
                  className="max-w-[200px]"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "3px 9px 9px 9px",
                  }}
                >
                  <div className="px-[9px] py-[7px] flex flex-col gap-[5px]">{msg.content}</div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Message input bar */}
        <div
          className="flex items-center gap-[6px] shrink-0"
          style={{ backgroundColor: "#EFEFE4", padding: "6px 8px" }}
        >
          <div
            className="flex-1 rounded-full bg-white flex items-center"
            style={{ padding: "5px 10px" }}
          >
            <span className="text-[10px] font-sans text-[#999] leading-[12px]">Message</span>
          </div>
          <div className="w-[22px] h-[22px] rounded-full bg-[#517DA2] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 6 L10 1 L7 6 L10 11Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
        {/* Home indicator */}
        <div className="flex justify-center py-[5px]" style={{ backgroundColor: "#EFEFE4" }}>
          <div className="rounded-full bg-black opacity-15" style={{ width: 48, height: 4 }} />
        </div>

        {/* Notch */}
        <div
          className="absolute bg-black"
          style={{
            width: s.notch,
            height: 24,
            borderRadius: 12,
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </div>
  );
}

// Pre-built phone screen content for each slide

export function BalanceScreen() {
  return (
    <>
      <div className="text-[12px] font-bold font-sans text-[#1A1A1A] leading-[16px]">Your Portfolio</div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="Total" value="$12,847" valueBold />
        <Row label="SOL" value="45.2" small />
        <Row label="USDC" value="4,200" small />
        <Row label="BONK" value="85.2M" small />
      </div>
    </>
  );
}

export function SecurityScreen() {
  return (
    <div
      className="flex flex-col gap-1 max-w-[160px] px-[7px] py-[5px]"
      style={{
        borderLeft: "2px solid #FF4545",
      }}
    >
      <div className="flex items-center gap-[3px]">
        <div className="w-1 h-1 rounded-sm bg-[#FF4545]" />
        <span className="text-[8px] font-bold font-sans text-[#CC0000] leading-[10px]">SECURITY ALERT</span>
      </div>
      <div className="text-[10px] leading-[14px] font-sans text-[#333]">Authority changed on XYZ Lending</div>
      <div className="bg-[#FFF5F5] rounded-[3px] p-[3px]">
        <div className="flex justify-between">
          <span className="text-[8px] font-sans text-[#999] leading-[10px]">Exposure</span>
          <span className="text-[8px] font-mono font-bold text-[#CC0000] leading-[10px]">$4,200</span>
        </div>
      </div>
      <div className="flex items-center justify-center bg-[#CC0000] rounded py-1 px-1">
        <span className="text-[9px] font-semibold font-sans text-white leading-[12px]">Withdraw now</span>
      </div>
    </div>
  );
}

export function TokenIntelScreen() {
  return (
    <>
      <div className="text-[12px] font-bold font-sans text-[#1A1A1A] leading-[16px]">BONK Autopsy</div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="Price" value="$0.00003" small />
        <Row label="MCap" value="$2.1B" small />
        <Row label="Holders" value="847K" small />
      </div>
      <div className="flex items-center gap-[2px] self-start bg-[#EAFFF5] rounded-[3px] px-1 py-[2px]">
        <div className="w-[3px] h-[3px] rounded-sm bg-[#14F195]" />
        <span className="text-[7px] font-mono font-medium text-[#14A86C] leading-[10px]">Low risk</span>
      </div>
    </>
  );
}

export function SwapScreen() {
  return (
    <>
      <div className="text-[12px] font-bold font-sans text-[#1A1A1A] leading-[16px]">Swap Preview</div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <div className="flex justify-between">
          <span className="text-[9px] font-sans text-[#888] leading-[12px]">You send</span>
          <span className="text-[9px] font-mono font-semibold text-[#E65100] leading-[12px]">5.0 SOL</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[9px] font-sans text-[#888] leading-[12px]">You get</span>
          <span className="text-[9px] font-mono font-semibold text-[#14A86C] leading-[12px]">674.50 USDC</span>
        </div>
      </div>
      <div className="flex gap-[3px]">
        <div className="flex-1 flex items-center justify-center bg-[#14A86C] rounded py-1">
          <span className="text-[9px] font-semibold font-sans text-white leading-[12px]">Confirm</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#EEE] rounded py-1">
          <span className="text-[9px] font-medium font-sans text-[#999] leading-[12px]">Cancel</span>
        </div>
      </div>
    </>
  );
}

export function WalletStalkScreen() {
  return (
    <>
      <div className="text-[12px] font-bold font-sans text-[#1A1A1A] leading-[16px]">Whale Stalker — 8xPr...</div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="Portfolio" value="$2.4M" small />
        <Row label="7d PnL" value="+$184K" small valueColor="#14A86C" />
        <Row label="Win rate" value="72%" small />
      </div>
      <div className="text-[9px] font-sans text-[#555] leading-[13px]">
        This wallet is on a tear. Mostly memes + Solana infra plays.
      </div>
    </>
  );
}

export function BundleDetectionScreen() {
  return (
    <>
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 rounded-sm bg-[#FF4545]" />
        <span className="text-[10px] font-bold font-sans text-[#CC0000] leading-[12px]">BUNDLES DETECTED</span>
      </div>
      <div className="text-[10px] font-sans text-[#333] leading-[14px]">
        Found 7 wallets that bought $DOGGO in the same block on Raydium.
      </div>
      <div className="bg-[#F5F5F5] rounded-[3px] p-[3px] flex flex-col gap-[2px]">
        <Row label="Bundled wallets" value="7" small />
        <Row label="Total bought" value="18% supply" small />
        <Row label="Risk" value="HIGH" small valueColor="#CC0000" />
      </div>
      <div className="text-[9px] font-sans text-[#888] leading-[12px]">
        Coordinated dump incoming. Stay away.
      </div>
    </>
  );
}

function Row({
  label,
  value,
  small,
  valueBold,
  valueColor,
}: {
  label: string;
  value: string;
  small?: boolean;
  valueBold?: boolean;
  valueColor?: string;
}) {
  const size = small ? "text-[8px] leading-[10px]" : "text-[9px] leading-[12px]";
  return (
    <div className="flex justify-between">
      <span className={`font-sans text-[#888] ${small ? "text-[8px] leading-[10px]" : "text-[9px] leading-[12px]"}`}>
        {label}
      </span>
      <span
        className={`font-mono ${size} ${valueBold ? "text-[12px] leading-[16px] font-bold" : "font-semibold"}`}
        style={{ color: valueColor || "#1A1A1A" }}
      >
        {value}
      </span>
    </div>
  );
}
