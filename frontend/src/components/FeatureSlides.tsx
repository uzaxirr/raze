"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DemoPhone from "./DemoPhone";
import PhoneMockup, {
  BalanceScreen,
  SecurityScreen,
  TokenIntelScreen,
  SwapScreen,
  WalletStalkScreen,
  BundleDetectionScreen,
  WalletWatchingScreen,
  TransactionDecoderScreen,
  SmartAlertsScreen,
  TokenSnipingScreen,
  PredictionMarketsScreen,
  SendCryptoScreen,
} from "./PhoneMockup";
import {
  GhostDollarEyes,
  GhostAlert,
  GhostDetective,
  GhostWinking,
  GhostSpy,
  GhostAngry,
  GhostWatching,
  GhostNerdy,
  GhostBellRinger,
  GhostHungry,
  GhostFortuneTeller,
  GhostRocket,
} from "./GhostSVGs";

interface SlideData {
  headline: string;
  query: string;
  queryColor: string;
  description: string;
  bgColor: string;
  ghostPosition: "left" | "right" | "top";
  ghost: React.ReactNode;
  screen: React.ReactNode;
  userMessage: string;
  agentCallout?: string;
}

const slides: SlideData[] = [
  {
    headline: "Check your\nbalance",
    query: '"what\'s in my wallet?"',
    queryColor: "#9945FF",
    description: "See your full portfolio instantly. SOL, tokens, total value, and 24h gains — all in one message.",
    bgColor: "#EDE8FF",
    ghostPosition: "left",
    ghost: <GhostDollarEyes />,
    screen: <BalanceScreen />,
    userMessage: "what's in my wallet?",
    agentCallout: "Noticed the buy price? Raze remembered it from last Tuesday — without you asking.",
  },
  {
    headline: "Drift-proof\nsecurity",
    query: '"watch my programs"',
    queryColor: "#CC0000",
    description: "After the $270M Drift hack, Raze watches every program you use. You'll know in seconds, not weeks.",
    bgColor: "#FFE0E0",
    ghostPosition: "right",
    ghost: <GhostAlert />,
    screen: <SecurityScreen />,
    userMessage: "watch my programs",
    agentCallout: "That alert came at 3:47 AM. Raze never sleeps.",
  },
  {
    headline: "Full token\nautopsies",
    query: '"is BONK safe?"',
    queryColor: "#14A86C",
    description: "Price, ATH, holders, volume, risk score. Know if it's pumping, dumping, or dead before you ape in.",
    bgColor: "#DFFFF0",
    ghostPosition: "top",
    ghost: <GhostDetective />,
    screen: <TokenIntelScreen />,
    userMessage: "is BONK safe?",
    agentCallout: "Checked security, holders, momentum, and sentiment before answering.",
  },
  {
    headline: "Instant\nswaps",
    query: '"swap 5 SOL to USDC"',
    queryColor: "#9945FF",
    description: "Best route found automatically. Preview the trade, confirm with one tap. No dApp switching needed.",
    bgColor: "#E8E0FF",
    ghostPosition: "left",
    ghost: <GhostWinking />,
    screen: <SwapScreen />,
    userMessage: "swap 5 SOL to USDC",
    agentCallout: "Dropped Polymarket alpha after the swap — you didn't ask for it.",
  },
  {
    headline: "Stalk any\nwallet",
    query: '"what\'s this whale buying?"',
    queryColor: "#E85ABF",
    description: "Track any wallet's portfolio, PnL, and recent moves. Copy-trade the best or dodge the worst.",
    bgColor: "#FFE8F5",
    ghostPosition: "right",
    ghost: <GhostSpy />,
    screen: <WalletStalkScreen />,
    userMessage: "what's this whale buying?",
    agentCallout: "Knows you copy this whale regularly — offered to do it again.",
  },
  {
    headline: "Bundle\ndetection",
    query: '"check $DOGGO for bundles"',
    queryColor: "#CC0000",
    description: "Spot coordinated buys before the dump. Raze scans for wallet clusters buying in the same block.",
    bgColor: "#FFF0DD",
    ghostPosition: "top",
    ghost: <GhostAngry />,
    screen: <BundleDetectionScreen />,
    userMessage: "check $DOGGO for bundles",
  },
  {
    headline: "Watch any\nwallet",
    query: '"watch toly.sol"',
    queryColor: "#9945FF",
    description: "Get pinged the moment any wallet moves. Track the biggest players in real-time — swaps, transfers, everything.",
    bgColor: "#EDE8FF",
    ghostPosition: "right",
    ghost: <GhostWatching />,
    screen: <WalletWatchingScreen />,
    userMessage: "watch toly.sol",
    agentCallout: "Pinged you 2 minutes after setting the watch. Real-time via Helius.",
  },
  {
    headline: "Decode any\ntransaction",
    query: '"decode this tx 4sGjMx..."',
    queryColor: "#14A86C",
    description: "Paste any transaction hash and get a human-readable breakdown. Rate, slippage, fees — all decoded instantly.",
    bgColor: "#DFFFF0",
    ghostPosition: "left",
    ghost: <GhostNerdy />,
    screen: <TransactionDecoderScreen />,
    userMessage: "decode this tx 4sGjMx...",
  },
  {
    headline: "Smart\nalerts",
    query: '"alert me when whales buy BONK"',
    queryColor: "#E85ABF",
    description: "Set custom alerts for whale moves, price targets, or authority changes. Raze watches 24/7 so you don't have to.",
    bgColor: "#FFE8F5",
    ghostPosition: "top",
    ghost: <GhostBellRinger />,
    screen: <SmartAlertsScreen />,
    userMessage: "alert me when whales buy BONK",
    agentCallout: "Set it once — Raze monitors Jupiter + Raydium 24/7 and pings you in Telegram.",
  },
  {
    headline: "Snipe new\ntokens",
    query: '"find me new tokens launched"',
    queryColor: "#14A86C",
    description: "Fresh tokens filtered for safety. See mcap, holders, bundle risk — skip the rugs, find the gems.",
    bgColor: "#DFFFF0",
    ghostPosition: "right",
    ghost: <GhostHungry />,
    screen: <TokenSnipingScreen />,
    userMessage: "find me new tokens launched",
    agentCallout: "\"Filtered how you like it\" — Raze learned your risk appetite over time.",
  },
  {
    headline: "Prediction\nmarkets",
    query: '"what\'s trending on Polymarket?"',
    queryColor: "#9945FF",
    description: "See what the crowd thinks. Live odds on crypto events, ETF approvals, and price targets — all inside Telegram.",
    bgColor: "#E8E0FF",
    ghostPosition: "left",
    ghost: <GhostFortuneTeller />,
    screen: <PredictionMarketsScreen />,
    userMessage: "what's trending on Polymarket?",
    agentCallout: "Combined market odds with news sentiment to give you a real take — not just numbers.",
  },
  {
    headline: "Send\ncrypto",
    query: '"send 10 USDC to alice.sol"',
    queryColor: "#14A86C",
    description: "Transfer tokens to any .sol address in one message. Preview, confirm, done — faster than any wallet app.",
    bgColor: "#DFFFF0",
    ghostPosition: "top",
    ghost: <GhostRocket />,
    screen: <SendCryptoScreen />,
    userMessage: "send 10 USDC to alice.sol",
  },
];

const TOTAL_FEATURE_SLIDES = slides.length; // 12
const MORE_SLIDE_INDEX = TOTAL_FEATURE_SLIDES; // index 12 = "but that's not all"

export default function FeatureSlides() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moreTriggerRef = useRef<HTMLDivElement | null>(null);
  const isDemoMode = activeSlide >= MORE_SLIDE_INDEX;

  const setTriggerRef = useCallback((el: HTMLDivElement | null, i: number) => {
    triggerRefs.current[i] = el;
  }, []);

  // Observe section entrance for phone rise animation
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhoneVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Observe individual slides
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    triggerRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSlide(i);
        },
        { rootMargin: "-40% 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Observe "more" trigger slide
  useEffect(() => {
    if (!moreTriggerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActiveSlide(MORE_SLIDE_INDEX);
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    observer.observe(moreTriggerRef.current);
    return () => observer.disconnect();
  }, []);

  const active = isDemoMode ? slides[slides.length - 1] : slides[activeSlide];

  // Ghost positions: desktop uses absolute offsets, mobile uses smaller offsets
  const ghostPosDesktop = (pos: string): React.CSSProperties =>
    pos === "left"
      ? { left: -140, top: 40 }
      : pos === "right"
      ? { right: -140, top: 30 }
      : { top: -150, left: "50%", transform: "translateX(-50%)" };


  return (
    <section
      id="features"
      ref={sectionRef}
      style={{
        backgroundColor: isDemoMode ? "#F0EDFF" : active.bgColor,
        transition: "background-color 0.7s ease",
        clipPath: "inset(0 0 0 0)",
      }}
    >
      {/* This is a single scrollable area with a sticky center element */}
      <div className="relative max-w-[1440px] mx-auto">
        {/* Scroll triggers */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => setTriggerRef(el, i)}
            className="min-h-screen flex items-center relative"
          >
            {/* ===== MOBILE LAYOUT: vertical stack ===== */}
            <div className="lg:hidden flex flex-col items-center w-full px-6 py-12 gap-5">
              {/* Headline + query */}
              <div
                className="slide-content flex flex-col items-center text-center"
                data-active={String(activeSlide === i)}
              >
                <h2 className="font-display text-[30px] font-bold leading-[34px] tracking-[-0.04em] text-[#1A1A1A] whitespace-pre-line">
                  {slide.headline}
                </h2>
                <p className="font-mono text-[12px] leading-[16px] pt-2" style={{ color: slide.queryColor }}>
                  {slide.query}
                </p>
              </div>

              {/* Phone + ghost inline */}
              <div className="relative flex items-center justify-center" style={{ width: 260, minHeight: 340 }}>
                {/* Ghost peeking */}
                <div
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    ...(slide.ghostPosition === "left"
                      ? { left: -20, top: 10 }
                      : slide.ghostPosition === "right"
                      ? { right: -20, top: 10 }
                      : { top: -60, left: "50%", transform: "translateX(-50%)" }),
                    opacity: activeSlide === i ? 1 : 0,
                    scale: activeSlide === i ? "0.5" : "0.3",
                  }}
                >
                  {slide.ghost}
                </div>
                {/* Phone */}
                <div
                  className="transition-opacity duration-300"
                  style={{ opacity: activeSlide === i ? 1 : 0 }}
                >
                  <PhoneMockup
                    size="sm"
                    messages={[
                      { type: "user", content: slide.userMessage },
                      { type: "bot", content: slide.screen },
                    ]}
                  />
                </div>
              </div>

              {/* Frosted pill */}
              <div
                className="slide-content w-full"
                data-active={String(activeSlide === i)}
                style={{ transitionDelay: activeSlide === i ? "120ms" : "0ms" }}
              >
                <div className="frosted-pill rounded-2xl px-5 py-4">
                  <p className="font-sans text-[14px] leading-[21px] text-[#1A1A1A]">
                    {slide.description}
                  </p>
                  {slide.agentCallout && (
                    <div className="mt-3 pt-3 border-t border-white/30">
                      <p className="font-sans text-[12px] leading-[17px] text-[#9945FF] font-medium">
                        {slide.agentCallout}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== DESKTOP LAYOUT: left headline, center phone (sticky), right pill ===== */}
            <div className="hidden lg:flex items-center w-full h-screen">
              {/* Left headline */}
              <div
                className="slide-content ml-20 max-w-[340px]"
                data-active={String(activeSlide === i)}
              >
                <h2 className="font-display text-[52px] font-bold leading-[54px] tracking-[-0.04em] text-[#1A1A1A] whitespace-pre-line">
                  {slide.headline}
                </h2>
                <p className="font-mono text-[14px] leading-[18px] pt-3" style={{ color: slide.queryColor }}>
                  {slide.query}
                </p>
              </div>

              {/* Right frosted pill */}
              <div
                className="slide-content absolute right-20 max-w-[270px]"
                data-active={String(activeSlide === i)}
                style={{ transitionDelay: activeSlide === i ? "120ms" : "0ms" }}
              >
                <div className="frosted-pill rounded-2xl px-6 py-5">
                  <p className="font-sans text-[15px] leading-[22px] text-[#1A1A1A]">
                    {slide.description}
                  </p>
                  {slide.agentCallout && (
                    <div className="mt-3 pt-3 border-t border-white/30">
                      <p className="font-sans text-[13px] leading-[18px] text-[#9945FF] font-medium">
                        {slide.agentCallout}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* "But that's not all" slide — triggers demo mode */}
        <div
          ref={moreTriggerRef}
          className="min-h-screen flex items-center relative"
          style={{ backgroundColor: isDemoMode ? "#F5F3FF" : undefined, transition: "background-color 0.7s ease" }}
        >
          {/* Mobile */}
          <div className="lg:hidden flex flex-col items-center w-full px-6 py-12 gap-5">
            <div className="slide-content flex flex-col items-center text-center" data-active={String(isDemoMode)}>
              <h2 className="font-display text-[30px] font-bold leading-[34px] tracking-[-0.04em] text-[#1A1A1A]">
                But that&apos;s not all
              </h2>
              <p className="font-sans text-[13px] leading-[19px] text-[#888] mt-2 max-w-[300px]">
                Raze can do way more. Just type what you want.
              </p>
            </div>
            {/* Inline demo phone for mobile */}
            <div style={{ width: 230, height: 460, borderRadius: 36, padding: 3, background: "linear-gradient(145deg, #A8A8B0 0%, #78787F 100%)", boxShadow: "0 20px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", border: "2px solid rgba(0,0,0,0.15)" }}>
              <div style={{ width: 224, height: 454, borderRadius: 34, overflow: "hidden" }}>
                <DemoPhone active={isDemoMode} />
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:flex items-center w-full h-screen">
            <div className="slide-content ml-20 max-w-[400px]" data-active={String(isDemoMode)}>
              <h2 className="font-display text-[52px] font-bold leading-[54px] tracking-[-0.04em] text-[#1A1A1A]">
                But that&apos;s<br />not all
              </h2>
              <p className="font-sans text-[16px] leading-[24px] text-[#888] mt-4 max-w-[360px]">
                Raze can do way more than what you just saw. PnL tracking, DeFi staking, limit orders, sentiment analysis, wallet deep-dives — just type what you want.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky phone overlay - DESKTOP ONLY */}
        <div
          className="hidden lg:block sticky bottom-0 h-0 pointer-events-none"
          style={{ zIndex: 15 }}
        >
          <div
            className={phoneVisible ? "phone-enter" : "phone-hidden"}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              height: "100vh",
              width: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="relative">
              {/* Ghost per slide */}
              {slides.map((slide, i) => (
                <div
                  key={`ghost-${i}`}
                  className="absolute transition-all duration-500 ease-out"
                  style={{
                    ...ghostPosDesktop(slide.ghostPosition),
                    opacity: !isDemoMode && activeSlide === i ? 1 : 0,
                    scale: !isDemoMode && activeSlide === i ? "1" : "0.6",
                  }}
                >
                  {slide.ghost}
                </div>
              ))}

              {/* Stacked phone screens + demo phone */}
              <div className="relative" style={{ width: 255, height: 510 }}>
                {/* Regular feature slides */}
                {slides.map((slide, i) => (
                  <div
                    key={`phone-${i}`}
                    className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                    style={{ opacity: !isDemoMode && activeSlide === i ? 1 : 0 }}
                  >
                    <PhoneMockup
                      size="md"
                      messages={[
                        { type: "user", content: slide.userMessage },
                        { type: "bot", content: slide.screen },
                      ]}
                    />
                  </div>
                ))}
                {/* Demo phone for "more" mode */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                  style={{ opacity: isDemoMode ? 1 : 0 }}
                >
                  <div style={{ width: 255, height: 510, borderRadius: 40, padding: 3, background: "linear-gradient(145deg, #A8A8B0 0%, #78787F 100%)", boxShadow: "0 20px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", border: "2px solid rgba(0,0,0,0.15)" }}>
                    <div style={{ width: 249, height: 504, borderRadius: 38, overflow: "hidden" }}>
                      <DemoPhone active={isDemoMode} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
