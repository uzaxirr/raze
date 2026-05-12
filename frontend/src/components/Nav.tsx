"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Nav() {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 0.85);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-5 py-6 transition-all duration-300
        sm:px-7 md:px-12 lg:px-20 xl:px-[120px]
        ${pastHero ? "bg-cream/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]" : "bg-transparent"}`}
      style={{ height: 89 }}
      aria-label="Primary navigation"
    >
      <a
        className="inline-flex items-center justify-center rounded-md"
        href="/"
        aria-label="raze.fun home"
      >
        <Image
          src="/landing/logo.svg"
          alt="raze.fun"
          width={120}
          height={40}
          className={`h-8 w-24 transition-all duration-300 sm:h-10 sm:w-[120px] ${
            pastHero ? "" : "brightness-0 invert"
          }`}
          priority
        />
      </a>
      <a
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-sm font-normal transition-all duration-300 ease-out hover:-translate-y-px
          ${pastHero
            ? "bg-accent text-cream"
            : "bg-cream text-accent"
          }`}
        href="https://t.me/razeaii_bot"
        target="_blank"
        rel="noopener noreferrer"
        style={{ minWidth: 126, minHeight: 41 }}
      >
        Start Chatting
      </a>
    </motion.header>
  );
}
