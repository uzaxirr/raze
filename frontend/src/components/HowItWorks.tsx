"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  {
    icon: "/landing/icon-phone.svg",
    title: "Open the bot",
    body: "Start a Telegram chat with Raze and ask for the action or analysis you want.",
  },
  {
    icon: "/landing/icon-eye.svg",
    title: "Review the answer",
    body: "Raze returns the route, risk context, wallet data, or alert setup in one readable message.",
  },
  {
    icon: "/landing/icon-security.svg",
    title: "Confirm or watch",
    body: "Approve the trade, set up an alert, or keep watching — all without leaving the chat.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HowItWorks() {
  return (
    <div className="flex flex-col items-center gap-7 md:gap-10">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="m-0 w-full text-center font-display text-[28px] leading-8 text-black md:text-[36px] md:leading-10"
      >
        How it works?
      </motion.h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="dashed-top-bottom relative grid w-full grid-cols-1 px-6 md:grid-cols-3 md:px-[60px] lg:px-[120px] xl:px-[200px]"
      >
        {steps.map((step, i) => (
          <motion.article
            key={i}
            variants={itemVariants}
            className={`relative flex flex-col items-start justify-center gap-4 py-6 md:h-[173px] md:px-8 md:py-4 lg:px-14
              ${i > 0 ? "dashed-top md:[background-image:none]" : ""}
            `}
            style={
              // Vertical dashed borders between cards on desktop
              i === 0
                ? {
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(0,0,0,0.2) 50%, transparent 50%)",
                    backgroundSize: "1px 14px",
                    backgroundPosition: "top right",
                    backgroundRepeat: "repeat-y",
                  }
                : i === 2
                  ? {
                      backgroundImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.2) 50%, transparent 50%)",
                      backgroundSize: "1px 14px",
                      backgroundPosition: "top left",
                      backgroundRepeat: "repeat-y",
                    }
                  : undefined
            }
          >
            <Image
              src={step.icon}
              alt=""
              width={32}
              height={32}
              className="icon-purple"
              aria-hidden="true"
            />
            <div className="flex w-full max-w-[275px] flex-col gap-2">
              <h3 className="m-0 text-lg font-medium leading-[25px] text-black md:text-xl">
                {step.title}
              </h3>
              <p className="m-0 text-[15px] leading-5 font-normal text-black/50 md:text-base md:leading-5">
                {step.body}
              </p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}
