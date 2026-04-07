"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PhoneMockup, {
  BalanceScreen,
  SecurityScreen,
  TokenIntelScreen,
  SwapScreen,
  WalletStalkScreen,
  BundleDetectionScreen,
} from "./PhoneMockup";
import { GhostDollarEyes, GhostAlert, GhostThinking } from "./GhostSVGs";

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
  },
  {
    headline: "Full token\nautopsies",
    query: '"is BONK safe?"',
    queryColor: "#14A86C",
    description: "Price, ATH, holders, volume, risk score. Know if it's pumping, dumping, or dead before you ape in.",
    bgColor: "#DFFFF0",
    ghostPosition: "top",
    ghost: <GhostThinking />,
    screen: <TokenIntelScreen />,
    userMessage: "is BONK safe?",
  },
  {
    headline: "Instant\nswaps",
    query: '"swap 5 SOL to USDC"',
    queryColor: "#9945FF",
    description: "Best route found automatically. Preview the trade, confirm with one tap. No dApp switching needed.",
    bgColor: "#E8E0FF",
    ghostPosition: "left",
    ghost: <GhostDollarEyes />,
    screen: <SwapScreen />,
    userMessage: "swap 5 SOL to USDC",
  },
  {
    headline: "Stalk any\nwallet",
    query: '"what\'s this whale buying?"',
    queryColor: "#E85ABF",
    description: "Track any wallet's portfolio, PnL, and recent moves. Copy-trade the best or dodge the worst.",
    bgColor: "#FFE8F5",
    ghostPosition: "right",
    ghost: <GhostAlert />,
    screen: <WalletStalkScreen />,
    userMessage: "what's this whale buying?",
  },
  {
    headline: "Bundle\ndetection",
    query: '"check $DOGGO for bundles"',
    queryColor: "#CC0000",
    description: "Spot coordinated buys before the dump. Raze scans for wallet clusters buying in the same block.",
    bgColor: "#FFF0DD",
    ghostPosition: "top",
    ghost: <GhostThinking />,
    screen: <BundleDetectionScreen />,
    userMessage: "check $DOGGO for bundles",
  },
];

export default function FeatureSlides() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const active = slides[activeSlide];
  const ghostPos = (pos: string): React.CSSProperties =>
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
        backgroundColor: active.bgColor,
        transition: "background-color 0.7s ease",
        clipPath: "inset(0 0 0 0)",
      }}
    >
      {/* This is a single scrollable area with a sticky center element */}
      <div className="relative max-w-[1440px] mx-auto">
        {/* LEFT + RIGHT scroll columns with CENTER gap for the sticky phone */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => setTriggerRef(el, i)}
            className="h-screen flex items-center relative"
          >
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
              </div>
            </div>
          </div>
        ))}

        {/* Sticky phone overlay - positioned to not interfere with scroll */}
        <div
          className="sticky bottom-0 h-0 pointer-events-none"
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
                    ...ghostPos(slide.ghostPosition),
                    opacity: activeSlide === i ? 1 : 0,
                    scale: activeSlide === i ? "1" : "0.6",
                  }}
                >
                  {slide.ghost}
                </div>
              ))}

              {/* Stacked phone screens */}
              <div className="relative" style={{ width: 255, height: 510 }}>
                {slides.map((slide, i) => (
                  <div
                    key={`phone-${i}`}
                    className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                    style={{ opacity: activeSlide === i ? 1 : 0 }}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
