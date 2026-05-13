"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      className="relative h-svh min-h-[600px] w-full overflow-hidden bg-cover bg-center bg-no-repeat
        max-[600px]:bg-[url('/landing/hero-bg-mobile.png')]
        min-[601px]:bg-[url('/landing/hero-bg.png')]
        min-[1600px]:bg-[url('/landing/hero-bg-ultrawide.png')]"
      aria-labelledby="hero-title"
    >
{/* No overlay — designer's background handles contrast */}
      <div
        className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-4 text-center
          top-[128px] px-6
          sm:top-[136px] sm:px-6
          md:top-[149px] md:px-[400px]
          xl:top-[180px] xl:px-[480px]
          w-full max-w-[1280px] xl:max-w-[1600px] 2xl:max-w-[2200px]"
      >
        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full font-display text-cream
            text-[38px] leading-[1]
            min-[381px]:text-[44px]
            sm:text-[clamp(44px,11vw,60px)]
            md:text-[60px]
            xl:text-[72px] xl:min-h-[144px] xl:max-w-[600px]
            2xl:text-[88px] 2xl:max-w-[720px]
            max-w-[480px] tracking-tight"
          style={{ letterSpacing: "-0.01em" }}
        >
          Crypto was never this easy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full text-cream
            text-[16px] leading-[1.3]
            min-[381px]:text-[17px]
            sm:text-[18px]
            md:text-[20px] md:leading-[25px]
            xl:text-[22px] xl:leading-[28px] xl:max-w-[440px]
            max-w-[387px]"
          style={{}}

        >
          Trade smarter, save time, and stay ahead of the market anytime
          effortlessly
        </motion.p>
      </div>
    </section>
  );
}
