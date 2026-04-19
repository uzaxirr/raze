import { Metadata } from "next";
import AnimatedChat from "./AnimatedChat";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: "Raze — You were invited",
    description:
      "Your friend thinks you need a crypto co-pilot. Join the Raze waitlist.",
    openGraph: {
      title: "Raze — You were invited",
      description:
        "Your friend thinks you need a crypto co-pilot that trades, researches, and roasts you — all inside Telegram.",
      url: `https://raze.fun/ref/${code}`,
    },
    twitter: {
      card: "summary_large_image",
      title: "Raze — You were invited",
      description:
        "Your friend thinks you need a crypto co-pilot that trades, researches, and roasts you — all inside Telegram.",
    },
  };
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;
  const telegramLink = `https://t.me/razeaii_bot?start=ref_${code}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #FAFAFE 0%, #F0EDFF 60%, #E4DCFF 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}
    >
      {/* Mobile layout */}
      <div className="ref-mobile">
        {/* raze.fun wordmark */}
        <p
          style={{
            fontSize: "12px",
            color: "#BBB",
            letterSpacing: "0.1em",
            margin: 0,
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          raze.fun
        </p>

        {/* Mascot + raze wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/imp-expressions/waving.png"
            alt="Raze mascot"
            className="ref-mascot"
            style={{
              width: "48px",
              height: "48px",
              objectFit: "contain",
            }}
          />
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            raze
          </span>
        </div>

        {/* Headline */}
        <h1 className="ref-headline">you were invited.</h1>

        {/* Subtitle */}
        <p className="ref-subtitle">
          your friend thinks you need a crypto co-pilot
        </p>

        {/* Phone mockup */}
        <div className="ref-phone">
          <AnimatedChat />
        </div>

        {/* CTA */}
        <a href={telegramLink} className="ref-cta">
          Join Waitlist via Telegram &rarr;
        </a>

        {/* Footer */}
        <p
          style={{
            fontSize: "12px",
            color: "#999",
            margin: 0,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            letterSpacing: "0.02em",
          }}
        >
          raze.fun &middot; @raze_aii
        </p>
      </div>

      {/* Desktop layout */}
      <div className="ref-desktop">
        {/* Left side */}
        <div className="ref-desktop-left">
          {/* raze.fun wordmark */}
          <p
            style={{
              fontSize: "12px",
              color: "#BBB",
              letterSpacing: "0.1em",
              margin: 0,
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            raze.fun
          </p>

          {/* Mascot + raze wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/imp-expressions/waving.png"
              alt="Raze mascot"
              style={{
                width: "52px",
                height: "52px",
                objectFit: "contain",
              }}
            />
            <span
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: "-0.02em",
              }}
            >
              raze
            </span>
          </div>

          {/* Headline */}
          <h1
            className="ref-headline-desktop"
            style={{
              fontSize: "60px",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            you were
            <br />
            invited.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "16px",
              color: "#999",
              margin: 0,
              lineHeight: 1.5,
              maxWidth: "380px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            your friend thinks you need a crypto co-pilot
            <br />
            that trades, researches, and roasts you — all
            <br />
            inside telegram.
          </p>

          {/* CTA */}
          <a href={telegramLink} className="ref-cta ref-cta-desktop">
            Join Waitlist via Telegram &rarr;
          </a>

          {/* Footer */}
          <p
            style={{
              fontSize: "12px",
              color: "#999",
              margin: 0,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              letterSpacing: "0.02em",
            }}
          >
            raze.fun &middot; @raze_aii
          </p>
        </div>

        {/* Right side — phone */}
        <div className="ref-desktop-right">
          <div className="ref-phone ref-phone-desktop">
            <AnimatedChat />
          </div>
        </div>
      </div>

      <style>{`
        /* ---- Animations ---- */
        @keyframes refPhoneIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes refHeadlineIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes refSubtitleIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes refMascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes refCtaGlow {
          0%, 100% {
            box-shadow: 0 0 0px rgba(153, 69, 255, 0);
          }
          50% {
            box-shadow: 0 0 24px rgba(153, 69, 255, 0.3);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* ---- Mobile layout (default) ---- */
        .ref-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 24px 24px;
          max-width: 420px;
          width: 100%;
          height: 100vh;
          justify-content: center;
        }

        .ref-desktop {
          display: none;
        }

        .ref-mascot {
          animation: refMascotFloat 3s ease-in-out infinite;
        }

        .ref-headline {
          font-size: 26px;
          font-weight: 700;
          color: #1A1A1A;
          letter-spacing: -0.03em;
          margin: 0;
          text-align: center;
          animation: refHeadlineIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .ref-subtitle {
          font-size: 13px;
          color: #999;
          margin: 0;
          text-align: center;
          font-family: var(--font-inter), sans-serif;
          animation: refSubtitleIn 0.5s ease 0.15s both;
        }

        .ref-phone {
          width: 220px;
          height: 440px;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
          flex-shrink: 0;
          --phone-radius: 32px;
          animation: refPhoneIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .ref-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 360px;
          padding: 16px 24px;
          border-radius: 9999px;
          background: #9945FF;
          color: white;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          letter-spacing: -0.01em;
          font-family: var(--font-space-grotesk), sans-serif;
          animation: refCtaGlow 2.5s ease-in-out infinite;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          margin-top: 4px;
        }

        .ref-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 24px rgba(153, 69, 255, 0.4);
        }

        .ref-cta:active {
          transform: translateY(0);
        }

        .ref-cta:focus-visible {
          outline: 2px solid #9945FF;
          outline-offset: 3px;
        }

        /* ---- Desktop layout (>= 768px) ---- */
        @media (min-width: 768px) {
          .ref-mobile {
            display: none;
          }

          .ref-desktop {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 80px;
            width: 100%;
            max-width: 1100px;
            padding: 40px 60px;
          }

          .ref-desktop-left {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 440px;
          }

          .ref-headline-desktop {
            animation: refHeadlineIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .ref-desktop-right {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .ref-phone-desktop {
            width: 280px;
            height: 560px;
            border-radius: 38px;
            --phone-radius: 38px;
          }

          .ref-cta-desktop {
            width: 320px;
            max-width: 320px;
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
