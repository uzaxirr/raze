"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ChatMockup, { ChatMessage, Row } from "./ChatMockup";
import IphoneMockup from "./Iphone15Pro";

interface Feature {
  title: string;
  pill: string;
  pillClass: string;
  body: string;
  gradient: string;
  messages: ChatMessage[];
}

// Feature 1 — Research
const researchMessages: ChatMessage[] = [
  {
    sender: "user",
    content: "is BONK safe?",
  },
  {
    sender: "bot",
    content: (
      <div className="flex flex-col gap-[4px]">
        <div className="text-[9px] font-mono text-[#9945FF] leading-[12px] opacity-60">
          checked security, holders, momentum, sentiment...
        </div>
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
          <span className="text-[7px] font-mono font-medium text-[#14A86C] leading-[10px]">
            low risk · legit
          </span>
        </div>
        <div className="text-[9px] text-[#888] leading-[12px]">
          you&apos;re late tho, 25% off ATH. similar setup to when you missed WIF 💀
        </div>
      </div>
    ),
  },
];

// Feature 2 — Protect
const protectMessages: ChatMessage[] = [
  {
    sender: "user",
    content: "check $DOGGO for bundles",
  },
  {
    sender: "bot",
    content: (
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-1">
          <div className="w-[4px] h-[4px] rounded-sm bg-[#FF4545]" />
          <span className="text-[10px] font-bold font-sans text-[#CC0000] leading-[12px]">
            nope. bundled
          </span>
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
        <div className="text-[9px] text-[#888] leading-[12px]">
          dump incoming. stay away unless you like losing money 💀
        </div>
      </div>
    ),
  },
];

// Feature 3 — Monitor
const monitorMessages: ChatMessage[] = [
  {
    sender: "user",
    content: "what's this whale buying?",
  },
  {
    sender: "bot",
    content: (
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
        <div className="text-[9px] text-[#888] leading-[12px]">
          last time you copied them you made 40%. want me to ape in like usual?
        </div>
      </div>
    ),
  },
];

// Feature 4 — Swap
const swapMessages: ChatMessage[] = [
  {
    sender: "user",
    content: "swap 5 SOL to USDC",
  },
  {
    sender: "bot",
    content: (
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
        <div className="text-[9px] text-[#888] leading-[12px]">
          oh btw &apos;sol to $250 by march&apos; is 62% on polymarket. probably wrong knowing this
          market
        </div>
      </div>
    ),
  },
];

const features: Feature[] = [
  {
    title: "Research before you ape",
    pill: "Full dyor on 'POPCAT'",
    pillClass: "pill-blue",
    body: "Raze turns token security, holders, liquidity, whale activity, and market sentiment into one readable answer.",
    gradient: "gradient-blue-yellow",
    messages: researchMessages,
  },
  {
    title: "Protect active positions",
    pill: "Check $DOGGO for bundles",
    pillClass: "pill-red",
    body: "Authority changes, bundle risk, suspicious holders, and wallet exposure become alerts, not post-mortems.",
    gradient: "gradient-orange",
    messages: protectMessages,
  },
  {
    title: "Monitor wallets in real time",
    pill: "What's this whale buying?",
    pillClass: "pill-green",
    body: "Track wallets, decode transactions, and receive readable alerts without opening five dashboards.",
    gradient: "gradient-purple-green",
    messages: monitorMessages,
  },
  {
    title: "Swap any token instantly",
    pill: "Swap 2.3 SOL to USDC",
    pillClass: "pill-purple",
    body: "Best route found automatically. Preview the trade, confirm with one tap. No dApp switching needed.",
    gradient: "gradient-purple-pink",
    messages: swapMessages,
  },
];

function WordReveal({
  text,
  progress,
  isActive,
}: {
  text: string;
  progress: number;
  isActive: boolean;
}) {
  const words = text.split(" ");
  const litValue = progress * (words.length + 1);

  return (
    <p className="m-0 w-full max-w-[350px] text-[17px] leading-[22px] font-normal text-black sm:text-[20px] sm:leading-[25px] xl:max-w-[440px] xl:text-[22px] xl:leading-[28px] 2xl:max-w-[480px] 2xl:text-[24px] 2xl:leading-[30px]">
      {words.map((word, i) => {
        const wp = isActive ? Math.min(1, Math.max(0, litValue - i)) : 0;
        const opacity = isActive ? 0.2 + wp * 0.8 : 1;
        return (
          <span key={i} className="word" style={{ opacity }}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

// Build cumulative message arrays: feature 0 = [msg0], feature 1 = [msg0, msg1], etc.
const cumulativeMessages: ChatMessage[][] = [];
const animateFromIndices: number[] = [];
{
  let running: ChatMessage[] = [];
  for (const f of features) {
    const prevLen = running.length;
    running = [...running, ...f.messages];
    cumulativeMessages.push(running);
    animateFromIndices.push(prevLen);
  }
}

function PhoneMockup({
  messages,
  animateFrom,
  active,
  width,
}: {
  messages: ChatMessage[];
  animateFrom: number;
  active: boolean;
  width?: string;
}) {
  return (
    <IphoneMockup
      mode="light"
      style={{
        width: width ?? "clamp(280px, 34%, 380px)",
        filter:
          "drop-shadow(0 25px 50px rgba(0,0,0,0.3)) drop-shadow(0 10px 20px rgba(0,0,0,0.2))",
        zIndex: 1,
      }}
    >
      <ChatMockup messages={messages} animateFrom={animateFrom} active={active} />
    </IphoneMockup>
  );
}

function MobileFeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 px-6 py-8"
    >
      <div className="flex flex-col items-start gap-4">
        <h2 className="m-0 w-full max-w-[460px] font-display text-[38px] leading-[40px] font-normal text-black min-[381px]:text-[44px] min-[381px]:leading-[44px]">
          {feature.title}
        </h2>
        <span
          className={`${feature.pillClass} inline-flex items-center rounded-full px-4 py-2 text-sm font-normal leading-[17px] whitespace-nowrap`}
        >
          {feature.pill}
        </span>
      </div>
      <p className="m-0 w-full max-w-[350px] text-[17px] leading-[22px] font-normal text-black">
        {feature.body}
      </p>
      <div
        className={`${feature.gradient} relative isolate mt-2 grid w-full place-items-center overflow-hidden`}
        style={{ height: "58svh" }}
      >
        <Image
          src="/landing/dither.png"
          alt=""
          width={825}
          height={832}
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 object-cover object-right-center mix-blend-soft-light opacity-[0.16]"
          style={{
            width: "calc(58svh * 825 / 832)",
            height: "58svh",
            maxWidth: "none",
          }}
          aria-hidden="true"
        />
        <PhoneMockup messages={feature.messages} animateFrom={0} active={true} width="min(240px, 60vw)" />
      </div>
    </motion.article>
  );
}

export default function FeatureCarousel() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const tick = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth <= 600) {
      setIsMobile(true);
      return;
    }
    setIsMobile(false);

    const inner = innerRef.current;
    if (!inner) return;

    const rect = inner.getBoundingClientRect();
    const stickyDuration = inner.offsetHeight - window.innerHeight;
    if (stickyDuration <= 0) {
      setActiveIndex(0);
      return;
    }

    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(0.9999, scrolled / stickyDuration);
    const fullStep = progress * features.length;
    const idx = Math.min(features.length - 1, Math.floor(fullStep));
    const seg = Math.min(1, Math.max(0, fullStep - idx));

    setActiveIndex(idx);
    setSegmentProgress(seg);
  }, []);

  useEffect(() => {
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    const interval = setInterval(tick, 50);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      clearInterval(interval);
    };
  }, [tick]);

  if (isMobile) {
    return (
      <section className="relative bg-cream" aria-label="Raze features">
        {features.map((f, i) => (
          <MobileFeatureCard key={i} feature={f} />
        ))}
      </section>
    );
  }

  return (
    <section className="relative bg-cream" aria-label="Raze features">
      <div ref={innerRef} className="relative" style={{ height: "500svh" }}>
        <div
          className="sticky top-[89px] w-full overflow-hidden"
          style={{ height: "calc(100svh - 89px)" }}
        >
          <div className="grid h-full w-full grid-cols-2">
            {/* Left: Text */}
            <div className="relative h-full bg-cream">
              {features.map((f, i) => {
                const isActive = i === activeIndex;
                const isAfter = i < activeIndex;
                let transform = "translateY(40px)";
                let opacity = 0;
                if (isActive) {
                  transform = "translateY(0)";
                  opacity = 1;
                } else if (isAfter) {
                  transform = "translateY(-40px)";
                  opacity = 0;
                }

                return (
                  <article
                    key={i}
                    className="pointer-events-none absolute inset-0 flex flex-col items-start p-8 transition-all duration-500 ease-out md:p-10 xl:p-20 2xl:p-24"
                    style={{
                      opacity,
                      transform,
                      transition:
                        "opacity 0.5s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <div className="flex h-full w-full max-w-[460px] flex-col justify-between xl:max-w-[560px] 2xl:max-w-[640px]">
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="m-0 w-full max-w-[460px] font-display text-[48px] leading-[48px] font-normal text-black md:text-[52px] md:leading-[52px] xl:text-[64px] xl:leading-[64px] 2xl:text-[72px] 2xl:leading-[72px]">
                          {f.title}
                        </h2>
                        <span
                          className={`${f.pillClass} inline-flex items-center rounded-full px-4 py-2 text-sm font-normal leading-[17px] whitespace-nowrap`}
                        >
                          {f.pill}
                        </span>
                      </div>
                      <WordReveal
                        text={f.body}
                        progress={isActive ? segmentProgress : 0}
                        isActive={isActive}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Right: Visual — gradient layers + single persistent phone */}
            <div className="relative isolate h-full overflow-hidden">
              {/* Gradient backgrounds — one per feature, fade in/out */}
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`${f.gradient} pointer-events-none absolute inset-0 transition-opacity duration-600 ease-in-out`}
                  style={{ opacity: i === activeIndex ? 1 : 0 }}
                >
                  <Image
                    src="/landing/dither.png"
                    alt=""
                    width={825}
                    height={832}
                    className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 object-cover object-right-center mix-blend-soft-light opacity-[0.16]"
                    style={{
                      width: "calc(100svh * 825 / 832)",
                      height: "100svh",
                      maxWidth: "none",
                    }}
                    aria-hidden="true"
                  />
                </div>
              ))}
              {/* Single persistent phone — cumulative messages */}
              <div className="absolute inset-0 grid place-items-center" style={{ zIndex: 1 }}>
                <PhoneMockup
                  messages={cumulativeMessages[activeIndex]}
                  animateFrom={animateFromIndices[activeIndex]}
                  active={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
