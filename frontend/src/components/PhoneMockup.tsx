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
        background: "linear-gradient(145deg, #A8A8B0 0%, #78787F 100%)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
        border: "2px solid rgba(0,0,0,0.15)",
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

// Pre-built phone screen content — Raze voice: savage, lowercase, sarcastic friend

// MEMORY: references past buy price without being asked
export function BalanceScreen() {
  return (
    <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
      <span>45.2 sol, some usdc and bonk. not terrible for once</span>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px] mt-[4px]">
        <Row label="SOL" value="45.2" small />
        <Row label="USDC" value="4,200" small />
        <Row label="BONK" value="85.2M" small />
        <div className="border-t border-[#E5E5E5] pt-[2px] mt-[1px]">
          <Row label="total" value="$12,847" valueBold />
        </div>
      </div>
      <div className="text-[9px] text-[#888] mt-[3px]">oh btw your bonk is up 35% since you bought last tuesday. first W in a while 🎉</div>
    </div>
  );
}

// 24/7 WATCHING: unprompted alert at 3AM — Raze never sleeps
export function SecurityScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[8px] font-mono text-[#AAA] leading-[10px]">3:47 AM</div>
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        yo wake up. XYZ Lending authority just changed. you have $4,200 in there and the new auth is unknown
      </div>
      <div className="bg-[#FFF5F5] rounded-[3px] p-[4px] flex flex-col gap-[2px]" style={{ borderLeft: "2px solid #FF4545" }}>
        <Row label="exposure" value="$4,200" small valueColor="#CC0000" />
        <Row label="old auth" value="9xK4...nP2q" small />
        <Row label="new auth" value="3fRz...unknown" small valueColor="#CC0000" />
      </div>
      <div className="text-[10px] font-sans font-semibold text-[#CC0000] leading-[14px]">pull it NOW 💀</div>
      <div className="flex items-center justify-center bg-[#CC0000] rounded py-1 px-1">
        <span className="text-[9px] font-semibold font-sans text-white leading-[12px]">withdraw all</span>
      </div>
    </div>
  );
}

// THINK/ANALYZE: shows Raze checked multiple sources before giving opinion
export function TokenIntelScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[9px] font-mono text-[#9945FF] leading-[12px] opacity-60">checked security, holders, momentum, sentiment...</div>
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        bonk looks clean. massive holder base, high liquidity, no bundles
      </div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="price" value="$0.00003" small />
        <Row label="mcap" value="$2.1B" small />
        <Row label="holders" value="847K" small />
        <Row label="momentum" value="6/8" small valueColor="#14A86C" />
      </div>
      <div className="flex items-center gap-[2px] self-start bg-[#EAFFF5] rounded-[3px] px-[5px] py-[2px]">
        <div className="w-[3px] h-[3px] rounded-sm bg-[#14F195]" />
        <span className="text-[7px] font-mono font-medium text-[#14A86C] leading-[10px]">low risk · legit</span>
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">you&apos;re late tho, 25% off ATH. similar setup to when you missed WIF 💀</div>
    </div>
  );
}

// PROACTIVE ALPHA: drops unrequested info after completing the swap
export function SwapScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        done. 674.50 usdc in your wallet
      </div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="sent" value="5.0 SOL" small valueColor="#E65100" />
        <Row label="got" value="674.50 USDC" small valueColor="#14A86C" />
        <Row label="via" value="Jupiter v2" small />
        <Row label="time" value="0.4s" small />
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">oh btw &apos;sol to $250 by march&apos; is 62% on polymarket. probably wrong knowing this market</div>
    </div>
  );
}

// MEMORY: "like usual" — remembers user copies this whale regularly
export function WalletStalkScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        your favorite whale is cooking again. $2.4M bag, 72% win rate
      </div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="portfolio" value="$2.4M" small />
        <Row label="7d PnL" value="+$184K" small valueColor="#14A86C" />
        <Row label="win rate" value="72%" small />
        <Row label="latest" value="bought $WIF" small valueColor="#9945FF" />
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">last time you copied them you made 40%. want me to ape in like usual?</div>
    </div>
  );
}

export function BundleDetectionScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-1">
        <div className="w-[4px] h-[4px] rounded-sm bg-[#FF4545]" />
        <span className="text-[10px] font-bold font-sans text-[#CC0000] leading-[12px]">nope. bundled</span>
      </div>
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        7 wallets bought $DOGGO same block on raydium. coordinated af
      </div>
      <div className="bg-[#F5F5F5] rounded-[3px] p-[3px] flex flex-col gap-[2px]">
        <Row label="bundled wallets" value="7" small />
        <Row label="bought" value="18% supply" small />
        <Row label="sold so far" value="0%" small />
        <Row label="risk" value="HIGH" small valueColor="#CC0000" />
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">dump incoming. stay away unless you like losing money 💀</div>
    </div>
  );
}

// 24/7 REAL-TIME: unprompted ping hours after setting the watch
export function WalletWatchingScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        done. watching <span className="font-mono text-[10px] bg-[#F0EDFF] px-[3px] rounded">toly.sol</span>
      </div>
      <div className="flex items-center gap-[3px] self-start bg-[#F0EDFF] rounded-[3px] px-[5px] py-[2px]">
        <div className="w-[3px] h-[3px] rounded-full bg-[#9945FF]" />
        <span className="text-[7px] font-mono font-medium text-[#9945FF] leading-[10px]">watching toly.sol</span>
      </div>
      <div className="text-[8px] font-mono text-[#AAA] leading-[10px] mt-[4px]">2 minutes later</div>
      <div className="bg-[#FFF8E6] rounded-[3px] p-[3px] flex flex-col gap-[2px]" style={{ borderLeft: "2px solid #FFD166" }}>
        <div className="text-[9px] font-sans text-[#1A1A1A] leading-[12px]">
          toly.sol just swapped 500 SOL for USDC on jupiter 👀
        </div>
        <div className="bg-[#F5F5F5] rounded-[3px] p-[3px] flex flex-col gap-[1px]">
          <Row label="sent" value="500 SOL" small valueColor="#E65100" />
          <Row label="got" value="67,450 USDC" small valueColor="#14A86C" />
        </div>
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">he&apos;s dumping. bearish signal or just taking profits? your call ser</div>
    </div>
  );
}

export function TransactionDecoderScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        jupiter swap. clean trade, didn&apos;t get rekt for once
      </div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="sent" value="2.5 SOL" small valueColor="#E65100" />
        <Row label="got" value="12,450 BONK" small valueColor="#14A86C" />
        <Row label="rate" value="4,980/SOL" small />
        <Row label="fee" value="0.000005" small />
        <Row label="slip" value="0.3%" small />
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">good rate tbh. want me to check if bonk is about to dump on you?</div>
    </div>
  );
}

export function SmartAlertsScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        done, watching for BONK whale buys above $50K on jupiter + raydium
      </div>
      <div className="flex items-center gap-[3px] self-start bg-[#F0EDFF] rounded-[3px] px-[5px] py-[2px]">
        <div className="w-[3px] h-[3px] rounded-full bg-[#9945FF]" />
        <span className="text-[7px] font-mono font-medium text-[#9945FF] leading-[10px]">whale alert active</span>
      </div>
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px] mt-[2px]">
        also pinging you when SOL touches $100
      </div>
      <div className="flex items-center gap-[3px] self-start bg-[#EAFFF5] rounded-[3px] px-[5px] py-[2px]">
        <div className="w-[3px] h-[3px] rounded-full bg-[#14F195]" />
        <span className="text-[7px] font-mono font-medium text-[#14A86C] leading-[10px]">2 alerts active</span>
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">want to stalk any whale wallets too? might help with your decision making</div>
    </div>
  );
}

// PROACTIVE + MEMORY: uses their risk preferences to filter results
export function TokenSnipingScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        filtered how you like it — no micro caps, no bundled trash:
      </div>
      <div className="flex flex-col gap-[3px]">
        {[
          { name: "$MOCHI", score: "7/8 🔥", mc: "$48K", change: "+340%", safe: true },
          { name: "$SOBA", score: "6/8", mc: "$22K", change: "+89%", safe: true },
          { name: "$RUGZ", score: "2/8 ⚠️", mc: "$120K", change: "+1200%", safe: false },
        ].map((t) => (
          <div key={t.name} className="bg-[#F5F5F5] rounded-[3px] p-[3px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-[#1A1A1A] leading-[12px]">{t.name} <span className="font-normal text-[8px]">{t.score}</span></span>
              <span className="text-[7px] font-sans text-[#999] leading-[9px]">MC {t.mc}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono font-bold text-[#14A86C] leading-[12px]">{t.change}</span>
              <span className={`text-[7px] font-mono leading-[9px] ${t.safe ? "text-[#14A86C]" : "text-[#CC0000]"}`}>
                {t.safe ? "clean" : "bundled 💀"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">$MOCHI looks like your usual type — degen but not suicidal. $RUGZ is an obvious rug skip it</div>
    </div>
  );
}

// THINK/ANALYZE: combines odds + sentiment research to give an actual take
export function PredictionMarketsScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[9px] font-mono text-[#9945FF] leading-[12px] opacity-60">checked odds + news + social sentiment...</div>
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        SOL $200 by june? market says 62% yes but sentiment is very bullish (4.2/5). might be undervalued tbh
      </div>
      <div className="bg-[#F5F5F5] rounded-[3px] p-[3px] flex flex-col gap-[2px]">
        <span className="text-[9px] font-sans font-medium text-[#1A1A1A] leading-[12px]">SOL $200 by June?</span>
        <div className="flex gap-[4px]">
          <div className="flex-1 bg-[#EAFFF5] rounded-[2px] flex items-center justify-center py-[2px]">
            <span className="text-[8px] font-mono font-bold text-[#14A86C] leading-[10px]">Yes 62%</span>
          </div>
          <div className="flex-1 bg-[#FFF5F5] rounded-[2px] flex items-center justify-center py-[2px]">
            <span className="text-[8px] font-mono font-bold text-[#CC0000] leading-[10px]">No 38%</span>
          </div>
        </div>
        <span className="text-[7px] font-sans text-[#AAA] leading-[9px]">vol: $4.2M · sentiment: bullish</span>
      </div>
      <div className="text-[9px] text-[#888] leading-[12px]">you were asking about SOL last week too. want alerts when odds shift? might actually make money for once</div>
    </div>
  );
}

export function SendCryptoScreen() {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
        10 usdc to <span className="font-mono text-[10px] bg-[#F0EDFF] px-[3px] rounded">alice.sol</span>. send it?
      </div>
      <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
        <Row label="to" value="alice.sol" small />
        <Row label="amount" value="10 USDC" small />
        <Row label="fee" value="~$0.001" small />
      </div>
      <div className="flex gap-[3px]">
        <div className="flex-1 flex items-center justify-center bg-[#14A86C] rounded py-1">
          <span className="text-[9px] font-semibold font-sans text-white leading-[12px]">send it</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#EEE] rounded py-1">
          <span className="text-[9px] font-medium font-sans text-[#999] leading-[12px]">nah</span>
        </div>
      </div>
    </div>
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
