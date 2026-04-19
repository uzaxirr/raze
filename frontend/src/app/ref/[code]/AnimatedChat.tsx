"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMessage {
  sender: "user" | "bot";
  lines: string[];
}

const EXCHANGES: [ChatMessage, ChatMessage][] = [
  [
    { sender: "user", lines: ["is $WIF safe?"] },
    {
      sender: "bot",
      lines: ["raze", "score: 8/8 \u2705 no mint auth.", "lp burned. clean \ud83d\ude0f"],
    },
  ],
  [
    { sender: "user", lines: ["swap 5 SOL to USDC"] },
    { sender: "bot", lines: ["raze", "done. 847.50 USDC \ud83d\udc80"] },
  ],
  [
    { sender: "user", lines: ["watch toly.sol"] },
    { sender: "bot", lines: ["raze", "watching \ud83d\udc40"] },
  ],
  [
    { sender: "user", lines: ["alert me if whales buy BONK"] },
    { sender: "bot", lines: ["raze", "alert set. pinging you \ud83d\udc0b"] },
  ],
];

const CHAR_DELAY = 30;
const PAUSE_AFTER_USER = 300;
const LINE_FADE_DURATION = 400;
const LINE_STAGGER = 200;
const HOLD_DURATION = 1500;
const SCROLL_DURATION = 500;
const PAUSE_BETWEEN = 1000;
const FINAL_HOLD = 1000;

interface VisibleExchange {
  userText: string;
  userDone: boolean;
  botLines: string[];
  botLinesVisible: number;
}

export default function AnimatedChat() {
  const [visibleExchanges, setVisibleExchanges] = useState<VisibleExchange[]>(
    []
  );
  const [fadeOut, setFadeOut] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const animating = useRef(true);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const scrollToBottom = useCallback(() => {
    if (chatBodyRef.current) {
      const el = chatBodyRef.current;
      const start = el.scrollTop;
      const end = el.scrollHeight - el.clientHeight;
      const diff = end - start;
      if (diff <= 0) return;

      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / SCROLL_DURATION, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.scrollTop = start + diff * ease;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, []);

  useEffect(() => {
    animating.current = true;

    async function runLoop() {
      while (animating.current) {
        setFadeOut(false);
        setVisibleExchanges([]);

        for (let i = 0; i < EXCHANGES.length; i++) {
          if (!animating.current) return;
          const [userMsg, botMsg] = EXCHANGES[i];

          await sleep(PAUSE_BETWEEN);

          // Type user message character by character
          const fullText = userMsg.lines[0];
          for (let c = 1; c <= fullText.length; c++) {
            if (!animating.current) return;
            const partial = fullText.slice(0, c);
            setVisibleExchanges((prev) => {
              const updated = [...prev];
              if (updated.length <= i) {
                updated.push({
                  userText: partial,
                  userDone: false,
                  botLines: [],
                  botLinesVisible: 0,
                });
              } else {
                updated[i] = { ...updated[i], userText: partial };
              }
              return updated;
            });
            await sleep(CHAR_DELAY);
          }

          // Mark user done
          setVisibleExchanges((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], userDone: true };
            return updated;
          });

          scrollToBottom();
          await sleep(PAUSE_AFTER_USER);

          // Fade in bot lines one by one (skip first line which is "raze" label)
          const botLines = botMsg.lines;
          setVisibleExchanges((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], botLines, botLinesVisible: 0 };
            return updated;
          });

          for (let l = 0; l < botLines.length; l++) {
            if (!animating.current) return;
            setVisibleExchanges((prev) => {
              const updated = [...prev];
              updated[i] = { ...updated[i], botLinesVisible: l + 1 };
              return updated;
            });
            scrollToBottom();
            await sleep(l === 0 ? 0 : LINE_STAGGER);
          }

          await sleep(LINE_FADE_DURATION);
          scrollToBottom();
          await sleep(HOLD_DURATION);
        }

        // Final hold then fade out
        await sleep(FINAL_HOLD);
        setFadeOut(true);
        await sleep(800);
      }
    }

    runLoop();
    return () => {
      animating.current = false;
    };
  }, [scrollToBottom]);

  return (
    <div
      className="phone-shell"
      style={{
        width: "100%",
        height: "100%",
        background: "#1A1A1A",
        borderRadius: "inherit",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Screen */}
      <div
        style={{
          flex: 1,
          borderRadius: "calc(var(--phone-radius, 32px) - 8px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#f3f0ff",
          position: "relative",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            background: "#4A7FB8",
            padding: "8px 20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            fontWeight: 600,
            color: "white",
            position: "relative",
          }}
        >
          <span style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            9:41
          </span>
          {/* Dynamic island */}
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "22px",
              background: "#1A1A1A",
              borderRadius: "14px",
            }}
          />
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
              <circle cx="3" cy="5" r="2.5" />
              <circle cx="7" cy="5" r="2.5" />
              <circle cx="11" cy="5" r="2.5" />
            </svg>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <polygon points="5,0 10,10 0,10" />
            </svg>
            <svg width="8" height="10" viewBox="0 0 8 10" fill="white">
              <rect x="0" y="2" width="6" height="8" rx="1" fill="none" stroke="white" strokeWidth="1.2" />
              <rect x="1" y="4" width="4" height="4" rx="0.5" fill="white" />
            </svg>
          </div>
        </div>

        {/* Chat header */}
        <div
          style={{
            background: "#4A7FB8",
            padding: "8px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 1L1 7l6 6" />
          </svg>
          {/* Avatar */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#9945FF",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/imp-expressions/waving.png"
              alt=""
              style={{
                width: "200%",
                height: "200%",
                objectFit: "cover",
                transform: "translate(-0%, -18%)",
              }}
            />
          </div>
          <div>
            <div
              style={{
                color: "white",
                fontWeight: 600,
                fontSize: "15px",
                lineHeight: 1.2,
              }}
            >
              Raze
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "12px",
                lineHeight: 1.2,
              }}
            >
              bot &middot; online
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div
          ref={chatBodyRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            scrollbarWidth: "none",
            transition: fadeOut ? "opacity 0.8s ease" : "none",
            opacity: fadeOut ? 0 : 1,
          }}
        >
          {visibleExchanges.map((exchange, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* User bubble */}
              {exchange.userText && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      background: "#D6F0B8",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "8px 12px",
                      maxWidth: "75%",
                      fontSize: "13px",
                      lineHeight: 1.4,
                      color: "#1A1A1A",
                      fontFamily: "var(--font-inter), sans-serif",
                    }}
                  >
                    {exchange.userText}
                    {!exchange.userDone && (
                      <span
                        style={{
                          display: "inline-block",
                          width: "2px",
                          height: "14px",
                          background: "#1A1A1A",
                          marginLeft: "1px",
                          verticalAlign: "middle",
                          animation: "blink 0.8s step-end infinite",
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Bot bubble */}
              {exchange.botLinesVisible > 0 && (
                <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                  {/* Bot avatar */}
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#9945FF",
                      overflow: "hidden",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/imp-expressions/waving.png"
                      alt=""
                      style={{
                        width: "200%",
                        height: "200%",
                        objectFit: "cover",
                        transform: "translate(-0%, -18%)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "4px 16px 16px 16px",
                      padding: "8px 12px",
                      maxWidth: "75%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                    }}
                  >
                    {exchange.botLines
                      .slice(0, exchange.botLinesVisible)
                      .map((line, l) => (
                        <div
                          key={l}
                          style={{
                            fontSize: l === 0 ? "11px" : "13px",
                            lineHeight: 1.4,
                            color: l === 0 ? "#9945FF" : "#1A1A1A",
                            fontFamily:
                              l === 0
                                ? "var(--font-jetbrains-mono), monospace"
                                : "var(--font-inter), sans-serif",
                            fontWeight: l === 0 ? 600 : 400,
                            animation: `chatFadeIn ${LINE_FADE_DURATION}ms ease both`,
                            animationDelay: `${l * LINE_STAGGER}ms`,
                          }}
                        >
                          {line}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Composer */}
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "white",
            borderTop: "1px solid #eee",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "34px",
              borderRadius: "17px",
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              fontSize: "13px",
              color: "#aaa",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Message...
          </div>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#9945FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M7 12V2M7 2l-4 4M7 2l4 4" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes chatFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        .phone-shell *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
