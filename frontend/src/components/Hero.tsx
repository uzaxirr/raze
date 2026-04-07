"use client";

import { GhostWaving } from "./GhostSVGs";
import PhoneMockup, { SwapScreen, SecurityScreen } from "./PhoneMockup";

export default function Hero() {
  return (
    <section
      className="w-full flex flex-col items-center pt-[70px]"
      style={{
        background: "linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)",
      }}
    >
      {/* Top: headline + ghost */}
      <div className="flex items-center justify-center gap-20 w-full max-w-[1440px] px-[120px] pt-16 pb-12">
        <div className="flex flex-col gap-6 max-w-[520px]">
          <h1 className="font-display text-[64px] font-bold leading-[66px] tracking-[-0.04em] text-[#1A1A1A] animate-fade-up">
            Built for people who live on-chain
          </h1>
          <p className="font-sans text-[18px] leading-[28px] text-[#666] animate-fade-up delay-100">
            Trade, research, and explore Solana through natural conversation. Your wallet, your
            trades, your alpha — all in one Telegram chat.
          </p>
          <div className="flex gap-3.5 pt-1 animate-fade-up delay-200">
            <a href="#cta" className="btn-glow bg-purple rounded-full px-7 py-3.5">
              <span className="font-sans text-[15px] font-semibold text-white leading-[18px]">Start Chatting</span>
            </a>
            <a href="#features" className="border-[1.5px] border-[#D0D0D0] hover:border-[#9945FF] hover:text-[#9945FF] transition-all rounded-full px-7 py-3.5">
              <span className="font-sans text-[15px] font-medium text-[#444] leading-[18px]">See how it works</span>
            </a>
          </div>
        </div>
        <GhostWaving className="shrink-0 animate-float" />
      </div>

      {/* Phone fan */}
      <div className="relative w-full max-w-[1440px] h-[620px] flex justify-center pb-[50px] mt-4">
        {/* Left phone - Trade (richer content) */}
        <div
          className="absolute bottom-[50px] left-[240px] flex flex-col items-center gap-2 animate-phone-rise delay-300"
          style={{ rotate: "-7deg" }}
        >
          <PhoneMockup
            size="sm"
            messages={[
              { type: "user", content: "swap 5 SOL to USDC" },
              {
                type: "bot",
                content: (
                  <>
                    <SwapScreen />
                    <div className="text-[8px] font-sans text-[#888] leading-[11px] pt-1">
                      via Jupiter v2 &middot; Rate: 1 SOL = 134.9 USDC
                    </div>
                  </>
                ),
              },
              { type: "user", content: "confirm" },
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-[3px]">
                      <div className="w-[4px] h-[4px] rounded-full bg-[#14A86C]" />
                      <span className="text-[9px] font-bold font-sans text-[#14A86C] leading-[12px]">SWAP COMPLETE</span>
                    </div>
                    <div className="text-[9px] font-sans text-[#555] leading-[12px]">
                      674.50 USDC received
                    </div>
                    <div className="text-[8px] font-mono text-[#AAA] leading-[10px]">
                      Confirmed in 0.4s
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <span className="font-display text-sm font-semibold text-purple-dark">Trade</span>
        </div>

        {/* Center phone - Research (richer content) */}
        <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-phone-rise delay-200">
          <PhoneMockup
            size="md"
            messages={[
              { type: "user", content: "is BONK safe? full breakdown" },
              {
                type: "bot",
                content: (
                  <>
                    <div className="text-[12px] font-bold font-sans text-[#1A1A1A] leading-[16px]">BONK Token Autopsy</div>
                    <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888] leading-[12px]">Price</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A] leading-[12px]">$0.00003</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888] leading-[12px]">24h</span>
                        <span className="text-[10px] font-mono font-semibold text-[#14A86C] leading-[12px]">+4.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888] leading-[12px]">MCap</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A] leading-[12px]">$2.1B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888] leading-[12px]">Holders</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A] leading-[12px]">847K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888] leading-[12px]">Vol 24h</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A] leading-[12px]">$84M</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[3px] self-start bg-[#EAFFF5] rounded px-[5px] py-[3px]">
                      <div className="w-1 h-1 rounded-sm bg-[#14F195]" />
                      <span className="text-[8px] font-mono font-medium text-[#14A86C] leading-[10px]">Low risk &middot; Legit project</span>
                    </div>
                    <div className="text-[9px] font-sans text-[#777] leading-[13px] pt-1">
                      Meme coin with massive holder base. High liquidity, no bundles detected. 25% off ATH.
                    </div>
                  </>
                ),
              },
            ]}
          />
          <span className="font-display text-sm font-semibold text-purple-dark">Research</span>
        </div>

        {/* Right phone - Protect (richer content) */}
        <div
          className="absolute bottom-[50px] right-[240px] flex flex-col items-center gap-2 animate-phone-rise delay-400"
          style={{ rotate: "7deg" }}
        >
          <PhoneMockup
            size="sm"
            messages={[
              {
                type: "bot",
                content: <SecurityScreen />,
              },
              { type: "user", content: "withdraw all from XYZ" },
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-[3px]">
                      <div className="w-[4px] h-[4px] rounded-full bg-[#14A86C]" />
                      <span className="text-[9px] font-bold font-sans text-[#14A86C] leading-[12px]">WITHDRAWN</span>
                    </div>
                    <div className="text-[9px] font-sans text-[#555] leading-[12px]">
                      4,200 USDC safe in wallet
                    </div>
                    <div className="text-[8px] font-mono text-[#AAA] leading-[10px]">
                      Confirmed in 0.8s
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <span className="font-display text-sm font-semibold text-purple-dark">Protect</span>
        </div>
      </div>
    </section>
  );
}
