"use client";

import { useEffect, useState, useRef } from "react";

interface DemoConvo {
  user: string;
  bot: string;
}

const demos: DemoConvo[] = [
  { user: "am i winning or losing", bot: "📈 you're UP $847 this month\n\nbest: BONK +$420\nworst: WIF -$89\n\nnot bad ser 🫡" },
  { user: "where should i park my sol", bot: "best yields rn:\n\n🥇 Jito — 8.2% APY\n🥈 Marinade — 7.8%\n\nwant in?" },
  { user: "buy sol if it dips to 170", bot: "📝 limit order set\n\n~2.94 SOL @ $170\nusing 500 USDC\n\ni'll snipe that dip 🎯" },
  { user: "who's printing today", bot: "🏆 top dawgs (24h):\n\n1. 7xK2...mP9q +$42K\n2. 3mN8...kL2w +$28K\n\nwant the alpha?" },
  { user: "what's toly.sol holding", bot: "587 tokens 💀\n\nBONK: 397.5M\nWEN: 802k\nUSDC: $559\n\nco-founder vibes" },
  { user: "what should i ape into", bot: "based on your history...\n\n👀 PENGU down 15%\nAI16Z pumping like WIF did\n\nwant alpha on either?" },
  { user: "when did i buy WIF", bot: "jan 8, 2024 @ $0.15\nnow worth $3,120\n\nthat's a 17x 🎯\nalmost sold at 2x lmao" },
  { user: "how much in fees total", bot: "this month: ~$4.30\nall time: ~$166\n\npretty efficient ser" },
  { user: "what's ct saying about JUP", bot: "📣 Bullish 🟢\nmentions +340% (24h)\ntop voices accumulating\n\nperps launch hype" },
  { user: "stake 5 sol on jito", bot: "✅ staked!\n\n5 SOL → 4.89 JitoSOL\n~0.41 SOL/year\n\npassive income 💰" },
  { user: "what was $TRUMP ATH", bot: "$46.12 (jan 19)\nnow $5.45 — down 88% 💀\n\nclassic celeb pump & dump" },
  { user: "show trending tokens", bot: "🔥 1. $BONK +127%\n2. $WIF +84%\n3. $POPCAT +56%\n\nwant me to analyze any?" },
];

interface ChatMsg {
  type: "user" | "bot";
  text: string;
}

export default function DemoPhone({ active }: { active: boolean }) {
  const [convoIdx, setConvoIdx] = useState(0);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [phase, setPhase] = useState<"idle" | "typing" | "sending" | "botReply" | "pause">("idle");
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, inputText]);

  // Start when active
  useEffect(() => {
    if (active && phase === "idle") setPhase("typing");
  }, [active, phase]);

  // Animation loop
  useEffect(() => {
    if (!active) return;
    const convo = demos[convoIdx];

    if (phase === "typing") {
      if (inputText.length < convo.user.length) {
        const t = setTimeout(() => {
          setInputText(convo.user.slice(0, inputText.length + 1));
        }, 18 + Math.random() * 12); // FAST typing
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("sending"), 200);
        return () => clearTimeout(t);
      }
    }

    if (phase === "sending") {
      setMessages((prev) => {
        // Guard: don't add if last message is already this user msg
        if (prev.length > 0 && prev[prev.length - 1].text === convo.user) return prev;
        return [...prev, { type: "user", text: convo.user }];
      });
      setInputText("");
      const t = setTimeout(() => setPhase("botReply"), 300);
      return () => clearTimeout(t);
    }

    if (phase === "botReply") {
      setMessages((prev) => {
        // Guard: don't add if last message is already this bot msg
        if (prev.length > 0 && prev[prev.length - 1].text === convo.bot) return prev;
        return [...prev, { type: "bot", text: convo.bot }];
      });
      const t = setTimeout(() => setPhase("pause"), 1800);
      return () => clearTimeout(t);
    }

    if (phase === "pause") {
      const t = setTimeout(() => {
        setConvoIdx((i) => (i + 1) % demos.length);
        setPhase("typing");
        // Keep last 4 messages max so chat doesn't overflow badly
        setMessages((prev) => prev.slice(-4));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, inputText, convoIdx, active]);

  return (
    <div className="flex flex-col overflow-hidden relative" style={{ width: "100%", height: "100%", borderRadius: "inherit", backgroundColor: "#000" }}>
      {/* Status bar */}
      <div className="flex items-end justify-between shrink-0" style={{ backgroundColor: "#517DA2", height: 52, paddingLeft: 22, paddingRight: 18 }}>
        <span className="text-white text-[12px] font-semibold font-sans" style={{ paddingBottom: 6 }}>9:41</span>
        <div className="flex items-center gap-[3px]" style={{ paddingBottom: 7 }}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="7" width="2.5" height="3" rx="0.5" fill="#FFF" /><rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill="#FFF" /><rect x="7" y="2.5" width="2.5" height="7.5" rx="0.5" fill="#FFF" /><rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill="#FFF" /></svg>
          <svg width="20" height="9" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" /><rect x="2" y="2" width="14" height="8" rx="1.5" fill="#FFF" /></svg>
        </div>
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-[7px] px-3 pt-1 pb-2" style={{ backgroundColor: "#517DA2" }}>
        <div className="w-7 h-7 rounded-[14px] bg-[#F0EDFF] shrink-0 overflow-hidden relative">
          <img
            src="/assets/imp-expressions/waving.png"
            alt="Raze"
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: "200%",
              height: "200%",
              objectFit: "contain",
              transform: "translate(-50%, -38%)",
            }}
            draggable={false}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-[13px] font-semibold font-sans leading-[15px]">Raze</span>
          <span className="text-white/60 text-[9px] font-sans leading-[11px]">online</span>
        </div>
      </div>

      {/* Chat area — scrollable, messages push up */}
      <div
        ref={chatRef}
        className="flex flex-col gap-[6px] grow px-[8px] py-[10px] overflow-y-auto"
        style={{ backgroundColor: "#C8D9E6", scrollBehavior: "smooth" }}
      >
        {messages.map((msg, i) =>
          msg.type === "user" ? (
            <div key={i} className="flex justify-end animate-fade-up" style={{ animationDuration: "0.2s" }}>
              <div className="px-[9px] py-[6px] text-[11px] leading-[15px] font-sans text-[#1A1A1A] max-w-[180px]" style={{ backgroundColor: "#EEFFDE", borderRadius: "9px 3px 9px 9px" }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start animate-fade-up" style={{ animationDuration: "0.25s" }}>
              <div className="max-w-[190px] px-[9px] py-[6px]" style={{ backgroundColor: "#FFFFFF", borderRadius: "3px 9px 9px 9px" }}>
                <div className="text-[10px] leading-[15px] font-sans text-[#1A1A1A] whitespace-pre-line">{msg.text}</div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-[6px] shrink-0" style={{ backgroundColor: "#EFEFE4", padding: "6px 8px" }}>
        <div className="flex-1 rounded-full bg-white flex items-center" style={{ padding: "5px 10px", minHeight: 26 }}>
          {inputText ? (
            <span className="text-[10px] font-sans text-[#1A1A1A] leading-[13px]">
              {inputText}
              <span className="inline-block w-[1.5px] h-[12px] bg-[#9945FF] ml-[1px] align-middle" style={{ animation: "cursor-blink 1s step-end infinite" }} />
            </span>
          ) : (
            <span className="text-[10px] font-sans text-[#999] leading-[12px]">Message</span>
          )}
        </div>
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            background: inputText.length > 0 ? "#517DA2" : "rgba(81,125,162,0.3)",
            transform: inputText.length > 0 ? "scale(1.1)" : "scale(1)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 6 L10 1 L7 6 L10 11Z" fill="#FFF" /></svg>
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center py-[5px]" style={{ backgroundColor: "#EFEFE4" }}>
        <div className="rounded-full bg-black opacity-15" style={{ width: 48, height: 4 }} />
      </div>

      {/* Notch */}
      <div className="absolute bg-black" style={{ width: 78, height: 24, borderRadius: 12, top: 10, left: "50%", transform: "translateX(-50%)" }} />
    </div>
  );
}
