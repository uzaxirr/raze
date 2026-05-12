"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  sender: "user" | "bot";
  content: React.ReactNode;
}

interface ChatMockupProps {
  /** All messages to show (cumulative across features) */
  messages: ChatMessage[];
  /** Index from which to start animating new messages. Messages before this render instantly. */
  animateFrom: number;
  /** Whether this mockup is currently active/visible */
  active: boolean;
}

// Row helper — label/value pairs for data tables inside bot messages
export function Row({
  label,
  value,
  small,
  valueBold,
  valueColor,
}: {
  label: string;
  value: string;
  small?: boolean;
  valueBold?: boolean;
  valueColor?: string;
}) {
  const sizeClass = small ? "text-[8px] leading-[10px]" : "text-[9px] leading-[12px]";
  return (
    <div className="flex justify-between">
      <span className={`font-sans text-[#888] ${sizeClass}`}>{label}</span>
      <span
        className={`font-mono ${sizeClass} ${valueBold ? "text-[12px] leading-[16px] font-bold" : "font-semibold"}`}
        style={{ color: valueColor ?? "#1A1A1A" }}
      >
        {value}
      </span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-[4px] px-[9px] py-[7px]"
        style={{ backgroundColor: "#FFFFFF", borderRadius: "3px 9px 9px 9px" }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              display: "block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#AAAAAA",
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * ChatMockup — Telegram dark-blue style, continuous conversation.
 *
 * Messages before `animateFrom` render instantly (old messages).
 * Messages from `animateFrom` onward animate in one by one (new batch).
 */
export default function ChatMockup({ active, messages, animateFrom }: ChatMockupProps) {
  // How many of the NEW messages (from animateFrom) are visible
  const [newVisibleCount, setNewVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref to access current messages in the async effect without stale closure
  const messagesRef = useRef(messages);
  const animateFromRef = useRef(animateFrom);
  messagesRef.current = messages;
  animateFromRef.current = animateFrom;

  useEffect(() => {
    if (!active) return;

    setNewVisibleCount(0);
    setShowTyping(false);
    let cancelled = false;

    const from = animateFrom;
    const batch = messages.slice(from);

    async function runSequence() {
      await delay(300);
      for (let i = 0; i < batch.length; i++) {
        if (cancelled) return;
        const msg = batch[i];
        if (msg.sender === "bot") {
          setShowTyping(true);
          await delay(500);
          if (cancelled) return;
          setShowTyping(false);
          await delay(80);
        } else {
          await delay(150);
        }
        if (cancelled) return;
        setNewVisibleCount(i + 1);
        await delay(600);
      }
    }

    runSequence();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateFrom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [newVisibleCount, showTyping]);

  const oldMessages = messages.slice(0, animateFrom);
  const newMessages = messages.slice(animateFrom);
  const visibleNewMessages = newMessages.slice(0, newVisibleCount);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Status bar spacer — sits behind the dynamic island */}
      <div className="shrink-0" style={{ backgroundColor: "#517DA2", height: 44 }} />

      {/* Chat header */}
      <div
        className="flex items-center gap-[8px] shrink-0"
        style={{ backgroundColor: "#517DA2", padding: "6px 12px 10px" }}
      >
        <div
          className="shrink-0 overflow-hidden relative"
          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#F0EDFF" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/imp-expressions/waving.png"
            alt="Raze"
            className="absolute pointer-events-none"
            style={{
              width: "200%",
              height: "200%",
              objectFit: "contain",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -38%)",
            }}
            draggable={false}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-semibold font-sans" style={{ fontSize: 13, lineHeight: "15px" }}>
            Raze
          </span>
          <span className="font-sans" style={{ fontSize: 9, lineHeight: "11px", color: "rgba(255,255,255,0.6)" }}>
            online
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-1.5 grow px-[7px] py-[9px] overflow-y-auto overflow-x-hidden"
        style={{ backgroundColor: "#C8D9E6", scrollbarWidth: "none" }}
      >
        {/* Old messages — render instantly, no animation */}
        {oldMessages.map((msg, i) => (
          <MessageBubble key={`old-${i}`} msg={msg} animate={false} />
        ))}

        {/* New messages — animate in */}
        <AnimatePresence initial={false}>
          {visibleNewMessages.map((msg, i) => (
            <MessageBubble key={`new-${animateFrom}-${i}`} msg={msg} animate={true} />
          ))}

          {showTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-[6px] shrink-0"
        style={{ backgroundColor: "#EFEFE4", padding: "6px 9px" }}
      >
        <div className="flex-1 rounded-full bg-white flex items-center" style={{ padding: "6px 11px" }}>
          <span className="font-sans text-[#999]" style={{ fontSize: 10, lineHeight: "12px" }}>Message</span>
        </div>
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 24, height: 24, backgroundColor: "#517DA2" }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M1 6 L10 1 L7 6 L10 11Z" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center shrink-0" style={{ backgroundColor: "#EFEFE4", padding: "4px 0" }}>
        <div className="rounded-full bg-black" style={{ width: 40, height: 3, opacity: 0.15 }} />
      </div>
    </div>
  );
}

function MessageBubble({ msg, animate }: { msg: ChatMessage; animate: boolean }) {
  const content = msg.sender === "user" ? (
    <div className="flex justify-end">
      <div
        className="px-[9px] py-1.5 font-sans text-[#1A1A1A]"
        style={{ backgroundColor: "#EEFFDE", borderRadius: "9px 3px 9px 9px", fontSize: 12, lineHeight: "16px" }}
      >
        {msg.content}
      </div>
    </div>
  ) : (
    <div className="flex justify-start">
      <div className="max-w-[200px]" style={{ backgroundColor: "#FFFFFF", borderRadius: "3px 9px 9px 9px" }}>
        <div className="px-[9px] py-[7px] flex flex-col gap-[5px]">{msg.content}</div>
      </div>
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}
