"use client";

import { useEffect, useState, useRef } from "react";
import ImpMascot from "./ImpMascot";

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Hide when scrolling down past 100px, show when scrolling up
      if (y > 100 && y > lastScrollY.current + 5) {
        setHidden(true);
      } else if (y < lastScrollY.current - 5) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        backdropFilter: scrolled ? "blur(16px) saturate(1.2)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(1.2)" : "none",
        backgroundColor: scrolled ? "rgba(250, 250, 254, 0.85)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.04)" : "1px solid transparent",
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto px-6 md:px-16 py-4">
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="nav-ghost inline-block">
            <ImpMascot
              expression="waving"
              className="w-[34px] h-[34px] object-contain"
            />
          </span>
          <span className="font-display text-xl font-bold text-[#1A1A1A] group-hover:text-purple transition-colors flex items-baseline">
            raze
            <span className="inline-flex items-baseline overflow-hidden">
              <span
                className="inline-block"
                style={{
                  animation: "dot-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both",
                }}
              >
                .
              </span>
              <span
                className="inline-block"
                style={{
                  animation: "fun-slide 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
                }}
              >
                fun
              </span>
            </span>
          </span>
        </a>
        <div className="flex items-center gap-9">
          <a
            href="#features"
            className="hidden md:inline font-sans text-[14px] text-[#888] hover:text-[#1A1A1A] transition-colors"
          >
            Features
          </a>
          <a
            href="https://t.me/razeaii_bot"
            className="hidden md:inline font-sans text-[14px] text-[#888] hover:text-[#1A1A1A] transition-colors"
          >
            How it works
          </a>
          <a
            href="https://t.me/razeaii_bot"
            className="btn-glow bg-[#1A1A1A] rounded-full px-[22px] py-[10px]"
          >
            <span className="font-sans text-[13px] font-medium text-white leading-4">
              Start Chatting
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}
