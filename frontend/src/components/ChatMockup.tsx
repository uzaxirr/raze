"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface ChatMockupProps {
  active: boolean;
  conversation: ChatMessage[];
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-[3px] px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: "block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#8E8E93",
          }}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function ChatMockup({ active, conversation }: ChatMockupProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all pending timeouts
  function clearPending() {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(() => {
    if (!active) {
      clearPending();
      setVisibleCount(0);
      setShowTyping(false);
      return;
    }

    // Start sequence from 0
    setVisibleCount(0);
    setShowTyping(false);

    let cancelled = false;

    async function runSequence() {
      for (let i = 0; i < conversation.length; i++) {
        if (cancelled) return;
        const msg = conversation[i];

        if (msg.sender === "bot") {
          // Show typing indicator first
          setShowTyping(true);
          await delay(400);
          if (cancelled) return;
          setShowTyping(false);
        }

        await delay(msg.sender === "user" ? 100 : 80);
        if (cancelled) return;
        setVisibleCount(i + 1);
        await delay(600);
      }
    }

    runSequence();

    return () => {
      cancelled = true;
      clearPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, showTyping]);

  const visibleMessages = conversation.slice(0, visibleCount);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "#1C1C1E",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, sans-serif)",
        overflow: "hidden",
      }}
    >
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px 2px",
          backgroundColor: "#1C1C1E",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: "#FFFFFF", letterSpacing: 0.2 }}>9:41</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <rect x="0" y="5" width="2" height="4" rx="0.5" fill="white" opacity="0.5" />
            <rect x="2.5" y="3.5" width="2" height="5.5" rx="0.5" fill="white" opacity="0.7" />
            <rect x="5" y="2" width="2" height="7" rx="0.5" fill="white" opacity="0.9" />
            <rect x="7.5" y="0.5" width="2" height="8.5" rx="0.5" fill="white" />
          </svg>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M7 2C9.2 2 11.2 2.9 12.6 4.4L13.7 3.3C11.9 1.5 9.6 0.5 7 0.5C4.4 0.5 2.1 1.5 0.3 3.3L1.4 4.4C2.8 2.9 4.8 2 7 2Z" fill="white" opacity="0.5" />
            <path d="M7 4.5C8.5 4.5 9.8 5.1 10.8 6.1L11.9 5C10.5 3.7 8.8 3 7 3C5.2 3 3.5 3.7 2.1 5L3.2 6.1C4.2 5.1 5.5 4.5 7 4.5Z" fill="white" opacity="0.75" />
            <circle cx="7" cy="8.5" r="1.2" fill="white" />
          </svg>
          <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="white" strokeOpacity="0.35" />
            <rect x="1.5" y="1.5" width="14" height="8" rx="1.5" fill="white" />
            <path d="M20 3.5V7.5C20.8 7.2 21.5 6.4 21.5 5.5C21.5 4.6 20.8 3.8 20 3.5Z" fill="white" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Chat header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px 8px",
          backgroundColor: "#1C1C1E",
          borderBottom: "0.5px solid #2C2C2E",
          flexShrink: 0,
        }}
      >
        {/* Back arrow */}
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M8.5 1L1.5 8L8.5 15" stroke="#9945FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>R</span>
        </div>
        {/* Name + status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.2 }}>Raze</span>
          <span style={{ fontSize: 9.5, color: "#8E8E93", lineHeight: 1.2 }}>bot</span>
        </div>
        {/* Right icons */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 3.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 9c-1.8 0-3.3-.8-4.3-2.1.5-1.1 1.6-1.9 2.8-1.9h3c1.2 0 2.3.8 2.8 1.9C11.3 12.7 9.8 13.5 8 13.5z" fill="#9945FF" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="3" cy="8" r="1.5" fill="#9945FF" />
            <circle cx="8" cy="8" r="1.5" fill="#9945FF" />
            <circle cx="13" cy="8" r="1.5" fill="#9945FF" />
          </svg>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px 8px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          scrollbarWidth: "none",
        }}
      >
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: msg.sender === "user" ? "5px 10px" : "5px 10px",
                  borderRadius:
                    msg.sender === "user"
                      ? "14px 14px 3px 14px"
                      : "14px 14px 14px 3px",
                  backgroundColor: msg.sender === "user" ? "#EEFFDE" : "#2C2C2E",
                  color: msg.sender === "user" ? "#1A1A1A" : "#EBEBF5",
                  fontSize: 11,
                  lineHeight: 1.45,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                  letterSpacing: 0.1,
                }}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {showTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", justifyContent: "flex-start" }}
            >
              <div
                style={{
                  backgroundColor: "#2C2C2E",
                  borderRadius: "14px 14px 14px 3px",
                  minWidth: 40,
                }}
              >
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px 7px",
          backgroundColor: "#1C1C1E",
          borderTop: "0.5px solid #2C2C2E",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#2C2C2E",
            borderRadius: 18,
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "#636366" }}>Message</span>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6L11 1L6.5 6L11 11L1 6Z" fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
