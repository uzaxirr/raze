"use client";

import { useEffect, useState, useRef } from "react";
import { GhostNavLogo } from "./GhostSVGs";

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
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto px-16 py-4">
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="nav-ghost inline-block">
            <GhostNavLogo />
          </span>
          <span className="font-display text-xl font-bold text-[#1A1A1A] group-hover:text-purple transition-colors">
            raze
          </span>
        </a>
        <div className="flex items-center gap-9">
          <a
            href="#features"
            className="font-sans text-[14px] text-[#888] hover:text-[#1A1A1A] transition-colors"
          >
            Features
          </a>
          <a
            href="#cta"
            className="font-sans text-[14px] text-[#888] hover:text-[#1A1A1A] transition-colors"
          >
            How it works
          </a>
          <a
            href="#cta"
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
