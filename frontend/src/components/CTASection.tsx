"use client";

import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-4 px-6 py-20 text-center md:py-0"
    >
      <div className="flex flex-col items-center gap-2">
        <h2 className="m-0 whitespace-nowrap font-display text-[28px] leading-8 text-black md:text-[36px] md:leading-10">
          Touching grass? Still catch the move!
        </h2>
        <p className="m-0 max-w-[calc(100%-48px)] text-base leading-5 font-normal text-black/50 md:hidden">
          Use Raze as the front door for research, trading, monitoring, and
          protection without leaving Telegram.
        </p>
      </div>
      <a
        className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent px-4 py-3 text-sm font-normal leading-[17px] text-cream transition-transform duration-150 ease-out hover:-translate-y-px"
        href="https://t.me/razeaii_bot"
        target="_blank"
        rel="noopener noreferrer"
        style={{ width: 126, height: 41 }}
      >
        Start Chatting
      </a>
    </motion.div>
  );
}
