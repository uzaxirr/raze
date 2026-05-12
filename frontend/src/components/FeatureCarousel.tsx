"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ChatMockup, { ChatMessage } from "./ChatMockup";

interface Feature {
  title: string;
  pill: string;
  pillClass: string;
  body: string;
  gradient: string;
  conversation: ChatMessage[];
}

const features: Feature[] = [
  {
    title: "Research before you ape",
    pill: "Full dyor on 'POPCAT'",
    pillClass: "pill-blue",
    body: "Raze turns token security, holders, liquidity, whale activity, and market sentiment into one readable answer.",
    gradient: "gradient-blue-yellow",
    conversation: [
      { sender: "user", text: "is BONK safe?" },
      {
        sender: "bot",
        text: "checked security, holders, momentum, sentiment...",
      },
      {
        sender: "bot",
        text: "bonk looks clean. massive holder base, high liquidity, no bundles ✅\n\nprice: $0.00003\nmcap: $2.1B\nholders: 847K\nmomentum: 6/8\n\nyou're late tho, 25% off ATH. similar setup to when you missed WIF 😏\n\n• low risk · legit",
      },
    ],
  },
  {
    title: "Protect active positions",
    pill: "Check $DOGGO for bundles",
    pillClass: "pill-red",
    body: "Authority changes, bundle risk, suspicious holders, and wallet exposure become alerts, not post-mortems.",
    gradient: "gradient-orange",
    conversation: [
      { sender: "user", text: "check $DOGGO for bundles" },
      {
        sender: "bot",
        text: "🚨 nope. bundled.\n\n7 wallets bought $DOGGO same block on raydium. coordinated af\n\nbundled wallets: 7\nbought: 10% supply\nsold so far: 0%\nrisk: HIGH\n\ndump incoming. stay away unless you like losing money 💀",
      },
    ],
  },
  {
    title: "Monitor wallets in real time",
    pill: "What's this whale buying?",
    pillClass: "pill-green",
    body: "Track wallets, decode transactions, and receive readable alerts without opening five dashboards.",
    gradient: "gradient-purple-green",
    conversation: [
      { sender: "user", text: "what's this whale buying?" },
      {
        sender: "bot",
        text: "your fav whale is cooking 👨‍🍳\n\n$2.4M bag, 72% win rate\njust bought $WIF — $340K\n\nlast 7d:\n• WIF +$340K\n• JUP +$180K\n• BONK −$95K\n\nlast time you copied them you made 40%. want me to set alerts?",
      },
    ],
  },
  {
    title: "Swap any token instantly",
    pill: "Swap 2.3 SOL to USDC",
    pillClass: "pill-purple",
    body: "Best route found automatically. Preview the trade, confirm with one tap. No dApp switching needed.",
    gradient: "gradient-purple-pink",
    conversation: [
      { sender: "user", text: "swap 5 SOL to USDC" },
      {
        sender: "bot",
        text: "done ✅\n\n674.50 USDC in your wallet\nvia Jupiter, 0.4s\nslippage: 0.1%\nfee: $0.02\n\noh btw 'SOL to $250 by march' is 62% on polymarket. probably wrong knowing this market 😂",
      },
    ],
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

function PhoneMockup({ conversation, active }: { conversation: ChatMessage[]; active: boolean }) {
  return (
    <div style={{ width: "clamp(240px, 26%, 460px)" }}>
      <ChatMockup conversation={conversation} active={active} />
    </div>
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
        <div style={{ width: "min(220px, 60vw)", position: "relative", zIndex: 1 }}>
          <ChatMockup conversation={feature.conversation} active={true} />
        </div>
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

            {/* Right: Visual */}
            <div className="relative isolate h-full overflow-hidden">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`${f.gradient} pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-600 ease-in-out`}
                  style={{
                    opacity: i === activeIndex ? 1 : 0,
                    pointerEvents: i === activeIndex ? "auto" : "none",
                  }}
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
                  <PhoneMockup conversation={f.conversation} active={i === activeIndex} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
