"use client";

import { GhostWaving } from "./GhostSVGs";
import PhoneMockup from "./PhoneMockup";

export default function Hero() {
  return (
    <section
      className="w-full flex flex-col items-center pt-[70px]"
      style={{
        background: "linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)",
      }}
    >
      {/* Top: headline + ghost */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 w-full max-w-[1440px] px-6 md:px-[120px] pt-10 md:pt-16 pb-8 md:pb-12">
        {/* Ghost on top for mobile, right side for desktop */}
        <div className="md:hidden w-[80px] h-[80px] shrink-0 animate-float">
          <GhostWaving className="w-full h-full" />
        </div>
        <div className="flex flex-col gap-4 md:gap-6 max-w-[520px] items-center md:items-start text-center md:text-left">
          <h1 className="font-display text-[36px] md:text-[64px] font-bold leading-[40px] md:leading-[66px] tracking-[-0.04em] text-[#1A1A1A] animate-fade-up">
            Built for people who live on-chain
          </h1>
          <p className="font-sans text-[15px] md:text-[18px] leading-[24px] md:leading-[28px] text-[#666] animate-fade-up delay-100">
            Trade, research, and explore Solana through natural conversation. Your wallet, your
            trades, your alpha — all in one Telegram chat.
          </p>
          <div className="flex gap-3.5 pt-1 animate-fade-up delay-200">
            <a href="https://t.me/razeaii_bot" className="btn-glow bg-purple rounded-full px-7 py-3.5">
              <span className="font-sans text-[15px] font-semibold text-white leading-[18px]">Start Chatting</span>
            </a>
            <a href="#features" className="border-[1.5px] border-[#D0D0D0] hover:border-[#9945FF] hover:text-[#9945FF] transition-all rounded-full px-7 py-3.5">
              <span className="font-sans text-[15px] font-medium text-[#444] leading-[18px]">See how it works</span>
            </a>
          </div>
        </div>
        <GhostWaving className="hidden md:block shrink-0 animate-float" />
      </div>

      {/* Phone fan - desktop: 3 phones, mobile: single center phone */}
      <div className="relative w-full max-w-[1440px] flex justify-center pb-[50px] mt-4 md:h-[620px]">
        {/* Left phone - Trade (hidden on mobile) */}
        <div
          className="hidden md:flex absolute bottom-[50px] left-[240px] flex-col items-center gap-2 animate-phone-rise delay-300"
          style={{ rotate: "-7deg" }}
        >
          <PhoneMockup
            size="sm"
            messages={[
              { type: "user", content: "swap 5 SOL to USDC" },
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-[4px]">
                    <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
                      5 sol → 674.50 usdc via jupiter. send it?
                    </div>
                    <div className="bg-[#F5F5F5] rounded-[4px] p-[4px] flex flex-col gap-[2px]">
                      <div className="flex justify-between">
                        <span className="text-[8px] font-sans text-[#888]">send</span>
                        <span className="text-[8px] font-mono font-semibold text-[#E65100]">5.0 SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[8px] font-sans text-[#888]">get</span>
                        <span className="text-[8px] font-mono font-semibold text-[#14A86C]">674.50 USDC</span>
                      </div>
                    </div>
                    <div className="flex gap-[3px]">
                      <div className="flex-1 flex items-center justify-center bg-[#14A86C] rounded py-[3px]">
                        <span className="text-[8px] font-semibold font-sans text-white">send it</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center bg-[#EEE] rounded py-[3px]">
                        <span className="text-[8px] font-medium font-sans text-[#999]">nah</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              { type: "user", content: "send it" },
              {
                type: "bot",
                content: (
                  <div className="text-[11px] font-sans text-[#1A1A1A] leading-[15px]">
                    done. 674.50 usdc in your wallet. want alerts if sol dumps more so you can feel smart? 😏
                  </div>
                ),
              },
            ]}
          />
          <span className="font-display text-sm font-semibold text-purple-dark">Trade</span>
        </div>

        {/* Center phone - Research */}
        <div className="flex flex-col items-center gap-2 animate-phone-rise delay-200 md:absolute md:bottom-[50px] md:left-1/2 md:-translate-x-1/2">
          <PhoneMockup
            size="sm"
            className="md:hidden"
            messages={[
              { type: "user", content: "is BONK safe? full breakdown" },
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-[4px]">
                    <div className="text-[12px] font-sans text-[#1A1A1A] leading-[16px]">
                      bonk? massive holder base, high liquidity, no bundles. legit project
                    </div>
                    <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">price</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$0.00003</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">mcap</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$2.1B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">holders</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">847K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">vol 24h</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$84M</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[3px] self-start bg-[#EAFFF5] rounded px-[5px] py-[3px]">
                      <div className="w-1 h-1 rounded-sm bg-[#14F195]" />
                      <span className="text-[8px] font-mono font-medium text-[#14A86C]">low risk · legit</span>
                    </div>
                    <div className="text-[10px] text-[#888] leading-[14px]">
                      you&apos;re late tho, 25% off ATH 💀
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <PhoneMockup
            size="md"
            className="hidden md:block"
            messages={[
              { type: "user", content: "is BONK safe? full breakdown" },
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-[4px]">
                    <div className="text-[12px] font-sans text-[#1A1A1A] leading-[16px]">
                      bonk? massive holder base, high liquidity, no bundles. legit project
                    </div>
                    <div className="bg-[#F5F5F5] rounded-[5px] p-[5px] flex flex-col gap-[3px]">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">price</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$0.00003</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">mcap</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$2.1B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">holders</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">847K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-sans text-[#888]">vol 24h</span>
                        <span className="text-[10px] font-mono font-semibold text-[#1A1A1A]">$84M</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-[3px] self-start bg-[#EAFFF5] rounded px-[5px] py-[3px]">
                      <div className="w-1 h-1 rounded-sm bg-[#14F195]" />
                      <span className="text-[8px] font-mono font-medium text-[#14A86C]">low risk · legit</span>
                    </div>
                    <div className="text-[10px] text-[#888] leading-[14px]">
                      you&apos;re late tho, 25% off ATH 💀
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <span className="font-display text-sm font-semibold text-purple-dark">Research</span>
        </div>

        {/* Right phone - Protect (hidden on mobile) */}
        <div
          className="hidden md:flex absolute bottom-[50px] right-[240px] flex-col items-center gap-2 animate-phone-rise delay-400"
          style={{ rotate: "7deg" }}
        >
          <PhoneMockup
            size="sm"
            messages={[
              {
                type: "bot",
                content: (
                  <div className="flex flex-col gap-[3px]">
                    <div className="text-[10px] font-sans text-[#1A1A1A] leading-[14px]">
                      yo heads up. XYZ Lending authority just changed. you have $4,200 in there
                    </div>
                    <div className="text-[9px] font-semibold text-[#CC0000]">pull it NOW 💀</div>
                    <div className="flex items-center justify-center bg-[#CC0000] rounded py-[3px]">
                      <span className="text-[8px] font-semibold font-sans text-white">withdraw all</span>
                    </div>
                  </div>
                ),
              },
              { type: "user", content: "withdraw all from XYZ" },
              {
                type: "bot",
                content: (
                  <div className="text-[10px] font-sans text-[#1A1A1A] leading-[14px]">
                    done. 4,200 usdc safe in wallet. that was close ser 😮‍💨
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
