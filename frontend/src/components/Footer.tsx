"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="dither-overlay-flip dashed-top relative flex items-center justify-between px-5 py-6 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]"
      style={{ height: 116 }}
    >
      <div className="relative z-10 flex flex-col items-start gap-2">
        <Image
          src="/landing/logo.svg"
          alt="raze.fun"
          width={120}
          height={40}
          className="icon-accent h-8 w-24 sm:h-10 sm:w-[120px]"
        />
        <p className="m-0 whitespace-nowrap text-base leading-5 font-normal text-black/50">
          &copy; 2026 Raze.fun
        </p>
      </div>
      <a
        className="relative z-10 inline-flex items-center justify-center"
        href="https://x.com/razeaii"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Raze on X"
        style={{ width: 46, height: 40 }}
      >
        <Image
          src="/landing/x-logo.svg"
          alt=""
          width={20}
          height={20}
          aria-hidden="true"
        />
      </a>
    </motion.footer>
  );
}
