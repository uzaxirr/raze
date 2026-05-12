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
    <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 10px" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: "block",
            width: 7,
            height: 7,
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

// Status bar icons (black for light theme)
function SignalIcon() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
      <rect x="0" y="5" width="2" height="4" rx="0.5" fill="black" opacity="0.4" />
      <rect x="2.5" y="3.5" width="2" height="5.5" rx="0.5" fill="black" opacity="0.6" />
      <rect x="5" y="2" width="2" height="7" rx="0.5" fill="black" opacity="0.8" />
      <rect x="7.5" y="0.5" width="2" height="8.5" rx="0.5" fill="black" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path
        d="M7 2C9.2 2 11.2 2.9 12.6 4.4L13.7 3.3C11.9 1.5 9.6 0.5 7 0.5C4.4 0.5 2.1 1.5 0.3 3.3L1.4 4.4C2.8 2.9 4.8 2 7 2Z"
        fill="black"
        opacity="0.4"
      />
      <path
        d="M7 4.5C8.5 4.5 9.8 5.1 10.8 6.1L11.9 5C10.5 3.7 8.8 3 7 3C5.2 3 3.5 3.7 2.1 5L3.2 6.1C4.2 5.1 5.5 4.5 7 4.5Z"
        fill="black"
        opacity="0.7"
      />
      <circle cx="7" cy="8.5" r="1.2" fill="black" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
      <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="black" strokeOpacity="0.35" />
      <rect x="1.5" y="1.5" width="14" height="8" rx="1.5" fill="black" />
      <path
        d="M20 3.5V7.5C20.8 7.2 21.5 6.4 21.5 5.5C21.5 4.6 20.8 3.8 20 3.5Z"
        fill="black"
        fillOpacity="0.4"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 10.8L11.3 10.5C10.8 10.4 10.4 10.6 10.1 10.9L8.7 12.3C6.7 11.3 5.1 9.7 4.1 7.7L5.5 6.3C5.8 6 5.9 5.6 5.8 5.1L5.5 2.9C5.4 2.4 5 2 4.5 2H2.6C2 2 1.5 2.5 1.5 3.1C1.5 9.3 6.1 14.5 13 14.5C13.6 14.5 14 14 14 13.4V11.5C14 11 13.6 10.9 13.5 10.8Z"
        fill="#007AFF"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <path
        d="M11 2H2C1.4 2 1 2.4 1 3V11C1 11.6 1.4 12 2 12H11C11.6 12 12 11.6 12 11V3C12 2.4 11.6 2 11 2Z"
        fill="#007AFF"
      />
      <path d="M12 5.5L17 3V11L12 8.5V5.5Z" fill="#007AFF" />
    </svg>
  );
}

export default function ChatMockup({ active, conversation }: ChatMockupProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      setVisibleCount(0);
      setShowTyping(false);
      return;
    }

    setVisibleCount(0);
    setShowTyping(false);

    let cancelled = false;

    async function runSequence() {
      for (let i = 0; i < conversation.length; i++) {
        if (cancelled) return;
        const msg = conversation[i];

        if (msg.sender === "bot") {
          setShowTyping(true);
          await delay(500);
          if (cancelled) return;
          setShowTyping(false);
          await delay(80);
        } else {
          await delay(100);
        }

        if (cancelled) return;
        setVisibleCount(i + 1);
        await delay(700);
      }
    }

    runSequence();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount, showTyping]);

  const visibleMessages = conversation.slice(0, visibleCount);

  return (
    <div
      style={{
        aspectRatio: "196 / 400",
        borderRadius: "17% / 8%",
        boxShadow:
          "0 35px 80px -12px rgba(0,0,0,0.32), 0 18px 40px -10px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        width: "100%",
      }}
    >
      {/* Status bar + Dynamic Island */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
          paddingTop: 6,
        }}
      >
        {/* Dynamic Island */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: "35%",
              height: 24,
              borderRadius: 20,
              backgroundColor: "#000000",
            }}
          />
        </div>
        {/* Status bar row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 14px 4px",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: "#000000", letterSpacing: 0.2 }}>
            9:41
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>
      </div>

      {/* Chat header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "5px 10px 8px",
          backgroundColor: "#F6F6F7",
          borderBottom: "1px solid #E6E6E6",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Back arrow + Messages */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 60 }}>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path
              d="M7 1L1.5 6.5L7 12"
              stroke="#007AFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 10, color: "#007AFF", fontWeight: 400 }}>Messages</span>
        </div>

        {/* Centered: avatar + name */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            👻
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: "#000000", lineHeight: 1.2 }}>
            Raze
          </span>
          <span style={{ fontSize: 8, color: "#34C759", lineHeight: 1.2 }}>online</span>
        </div>

        {/* Right icons */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <PhoneIcon />
          <VideoIcon />
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
          gap: 4,
          scrollbarWidth: "none",
          backgroundColor: "#FFFFFF",
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
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              {/* Bot avatar */}
              {msg.sender === "bot" && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    flexShrink: 0,
                    marginBottom: 2,
                  }}
                >
                  👻
                </div>
              )}
              <div
                style={{
                  maxWidth: "76%",
                  padding: "6px 10px",
                  borderRadius:
                    msg.sender === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  backgroundColor: msg.sender === "user" ? "#007AFF" : "#E9E9EB",
                  color: msg.sender === "user" ? "#FFFFFF" : "#1C1C1E",
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
              style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 4 }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9945FF 0%, #6B21D4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  flexShrink: 0,
                  marginBottom: 2,
                }}
              >
                👻
              </div>
              <div
                style={{
                  backgroundColor: "#E9E9EB",
                  borderRadius: "16px 16px 16px 4px",
                  minWidth: 44,
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
          padding: "5px 8px 6px",
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E6E6E6",
          flexShrink: 0,
        }}
      >
        {/* + button */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "#E9E9EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V9M1 5H9" stroke="#636366" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        {/* Input field */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            border: "1px solid #C4C4C6",
            borderRadius: 18,
            padding: "4px 10px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#8E8E93" }}>iMessage</span>
        </div>
        {/* Send button */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "#007AFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 8.5V1.5M2 4.5L5 1.5L8 4.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "4px 0 6px",
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "35%",
            height: 5,
            borderRadius: 3,
            backgroundColor: "#000000",
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
