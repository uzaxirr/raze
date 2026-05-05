const { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Easing } = window.Remotion;
const { IconifyIcon } = window;

const ChatMessage_raze = ({ text, isUser, delay, highlight }) => {
  const frame = useCurrentFrame();
  const progress = spring({ frame: frame - delay, fps: 30, config: { damping: 12, stiffness: 200 } });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        gap: 8,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        marginBottom: 20,
      }}
    >
      {/* Mini mascot avatar for bot messages */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C084FC, #9945FF)",
            flexShrink: 0,
          }}
        />
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "14px 18px",
          borderRadius: isUser ? "20px 6px 20px 20px" : "6px 20px 20px 20px",
          background: isUser ? "rgba(153, 69, 255, 0.12)" : "#FFFFFF",
          color: isUser ? "#6B2FD4" : "#1A0A2E",
          fontFamily: "Inter",
          fontSize: 15,
          fontWeight: isUser ? 500 : 400,
          boxShadow: isUser ? "none" : "0 2px 12px rgba(0, 0, 0, 0.04)",
          lineHeight: 1.5,
        }}
      >
        {highlight ? (
          <span dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          text
        )}
      </div>
    </div>
  );
};

const TypingIndicator_raze = ({ delay }) => {
  const frame = useCurrentFrame();
  const progress = spring({ frame: frame - delay, fps: 30, config: { damping: 12, stiffness: 200 } });
  const visible = frame >= delay && frame < delay + 30;

  if (!visible) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #C084FC, #9945FF)",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          padding: "16px 22px",
          borderRadius: "6px 20px 20px 20px",
          background: "#FFFFFF",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => {
          const bounce = Math.sin(((frame - delay) * 0.3) + i * 1.2) * 4;
          return (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#B8A0D8",
                transform: `translateY(${bounce}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const InputBar_raze = ({ opacity }) => {
  const frame = useCurrentFrame();
  const text = "check toly.sol";
  const charCount = Math.floor(interpolate(frame, [0, 150], [0, text.length], { extrapolateRight: "clamp" }));

  return (
    <div
      style={{
        minHeight: 56,
        background: "white",
        borderRadius: 20,
        display: "flex",
        alignItems: "center",
        padding: "8px 12px 8px 18px",
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [20, 0])}px)`,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(153, 69, 255, 0.1)",
      }}
    >
      <div
        style={{
          flex: 1,
          color: "#1A0A2E",
          fontFamily: "Inter",
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        <span>{text.slice(0, charCount)}</span>
        <span style={{ color: "#9945FF", fontWeight: 300, animation: "blink 0.6s step-end infinite" }}>|</span>
      </div>
      <button
        style={{
          background: "#9945FF",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <window.IconifyIcon icon="mdi:arrow-up" style={{ fontSize: 18, color: "white" }} />
      </button>
    </div>
  );
};

const IPhoneFrame_raze = ({ children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const phoneScale = spring({ frame, fps: 30, config: { damping: 15, stiffness: 100 } });

  const phoneWidth = 420;
  const phoneHeight = 860;
  const notchHeight = 44;
  const homeBarHeight = 34;

  return (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: `translate(-50%, -50%) scale(${phoneScale})`,
      width: phoneWidth,
      height: phoneHeight,
      background: "#1C1C1E",
      borderRadius: 55,
      boxShadow: "0 20px 80px rgba(153, 69, 255, 0.3), inset 0 0 0 2px #3A3A3C, inset 0 0 0 4px #1C1C1E",
      overflow: "hidden",
      padding: 12,
    }}>
      <div style={{
        width: "100%",
        height: "100%",
        borderRadius: 44,
        overflow: "hidden",
        position: "relative",
        background: "#F4EFFF",
      }}>
        {/* Status Bar */}
        <div style={{
          height: notchHeight,
          background: "#F4EFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}>
          <div style={{
            width: 126,
            height: 36,
            background: "#000000",
            borderRadius: 20,
            position: "absolute",
            top: 8,
          }} />
          <span style={{
            position: "absolute",
            left: 28,
            top: 14,
            fontSize: 15,
            fontWeight: "600",
            fontFamily: "Inter",
            color: "#1A0A2E",
          }}>9:41</span>
          <div style={{
            position: "absolute",
            right: 24,
            top: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <window.IconifyIcon icon="mdi:signal-cellular-3" style={{ fontSize: 16, color: "#1A0A2E" }} />
            <window.IconifyIcon icon="mdi:wifi" style={{ fontSize: 16, color: "#1A0A2E" }} />
            <window.IconifyIcon icon="mdi:battery" style={{ fontSize: 18, color: "#1A0A2E" }} />
          </div>
        </div>

        {/* Chat Header */}
        <div style={{
          padding: "8px 14px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(153, 69, 255, 0.08)",
          background: "#F4EFFF",
        }}>
          <span style={{ fontSize: 20, color: "#9945FF", fontWeight: 500 }}>‹</span>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C084FC, #9945FF)",
            flexShrink: 0,
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#14F195",
              border: "2px solid #F4EFFF",
            }} />
          </div>
          <div>
            <div style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#1A0A2E" }}>Raze</div>
            <div style={{ fontFamily: "Inter", fontSize: 11, fontWeight: 500, color: "#14C97A" }}>online</div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          height: `calc(100% - ${notchHeight + homeBarHeight + 52}px)`,
          overflow: "hidden",
          position: "relative",
        }}>
          {children}
        </div>

        {/* Home bar */}
        <div style={{
          height: homeBarHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4EFFF",
        }}>
          <div style={{
            width: 134,
            height: 5,
            background: "#1A0A2E",
            borderRadius: 3,
            opacity: 0.2,
          }} />
        </div>
      </div>
    </div>
  );
};

export default function RazeChatDemo() {
  const frame = useCurrentFrame();
  const progress = spring({ frame, fps: 30, config: { damping: 20, stiffness: 80 } });

  const messages = [
    { text: "scan my wallet", isUser: true, delay: 15 },
    { text: "$3.3k in stables. 4 dust attacks. 0.03 SOL — one failed tx from broke.", isUser: false, delay: 50 },
    { text: 'someone sent you <strong style="color:#9945FF">3,000 USDG</strong> yesterday. want me to trace?', isUser: false, delay: 70, highlight: true },
    { text: "trace it", isUser: true, delay: 100 },
    { text: 'sender has <strong style="color:#9945FF">10,533 SOL</strong>. they gave you pocket change.', isUser: false, delay: 135, highlight: true },
  ];

  return (
    <AbsoluteFill style={{ background: "#F4EFFF" }}>
      {/* Subtle background glow */}
      <div style={{
        position: "absolute",
        top: -100,
        right: -100,
        width: 500,
        height: 500,
        background: "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -80,
        left: -80,
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(20,241,149,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <IPhoneFrame_raze>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 10px" }}>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            {messages.map((msg, i) => (
              <ChatMessage_raze key={i} {...msg} />
            ))}
            {/* Typing indicator after "trace it" while waiting for bot reply */}
            <TypingIndicator_raze delay={110} />
          </div>
          <InputBar_raze opacity={progress} />
        </div>
      </IPhoneFrame_raze>

      {/* Wordmark at bottom */}
      {frame > 160 && (
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [160, 175], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily: "Space Grotesk",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: -1,
          display: "flex",
        }}>
          <span style={{ color: "#1A0A2E" }}>raze</span>
          <span style={{ color: "#9945FF" }}>.</span>
          <span style={{ color: "#1A0A2E" }}>fun</span>
        </div>
      )}
    </AbsoluteFill>
  );
}

export const durationInFrames_raze = 210;
