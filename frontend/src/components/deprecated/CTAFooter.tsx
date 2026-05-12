"use client";

import { useEffect, useRef, useState } from "react";
import { GhostCelebrating } from "./GhostSVGs";

export default function CTAFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      id="cta"
      ref={sectionRef}
      className="flex flex-col items-center w-full px-6 md:px-16 pt-16 md:pt-24 pb-12 md:pb-16 gap-5 md:gap-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 40%, #E4DCFF 100%)",
      }}
    >
      {/* Decorative blurred orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "#9945FF", top: -100, left: -100 }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
        style={{ background: "#14F195", bottom: -50, right: -50 }}
      />

      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="w-[60px] h-[70px] md:w-[90px] md:h-[105px]">
          <GhostCelebrating className="animate-float w-full h-full" />
        </div>

        <h2 className="font-display text-[28px] md:text-[48px] font-bold leading-[32px] md:leading-[52px] tracking-[-0.03em] text-[#1A1A1A] text-center max-w-[520px]">
          Your on-chain intelligence, one message away
        </h2>

        <p className="font-sans text-[15px] md:text-[17px] leading-[23px] md:leading-[26px] text-[#666] text-center max-w-[420px]">
          Trade, research, and explore Solana through natural conversation. Your wallet, your trades, your alpha.
        </p>

        <a
          href="#"
          className="btn-glow bg-purple rounded-full px-8 md:px-10 py-3.5 md:py-4 mt-2"
        >
          <span className="font-sans text-[15px] md:text-[17px] font-semibold text-white leading-[20px] md:leading-[22px]">
            Start Chatting
          </span>
        </a>

        <div className="flex gap-6 pt-10">
          {["Twitter", "Telegram", "GitHub"].map((link) => (
            <a
              key={link}
              href="#"
              className="font-sans text-[13px] text-[#AAA] hover:text-[#9945FF] transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>

        <p className="font-sans text-[12px] text-[#CCC] pt-2">
          &copy; 2026 Raze. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
