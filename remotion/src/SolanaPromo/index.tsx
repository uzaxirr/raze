import { AbsoluteFill, useVideoConfig, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS } from "./colors";
import { IntroScene } from "./components/IntroScene";
import { ChatDemoScene } from "./components/ChatDemoScene";
import { FeatureMontage } from "./components/FeatureMontage";
import { CTAScene } from "./components/CTAScene";

// Set to true when you have the audio file
const ENABLE_AUDIO = true;

// Re-export COLORS for backwards compatibility
export { COLORS };

export const SolanaPromo = () => {
  const { fps } = useVideoConfig();

  // Original timing for 30-second video
  const INTRO_DURATION = 2.5 * fps;           // 2.5s - Logo with particles
  const CHAT_DURATION = 8 * fps;              // 8s - Chat demo with phone on right
  const FEATURES_DURATION = 14 * fps;         // 14s - Feature montage (centered phone)
  const CTA_DURATION = 5.5 * fps;             // 5.5s - CTA
  const TRANSITION = 15;                       // Smooth transitions

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
      {/* Background music */}
      {ENABLE_AUDIO && (
        <Audio
          src={staticFile("background-music.mp3")}
          volume={0.3}
        />
      )}
      <TransitionSeries>
        {/* Scene 1: Intro with logo and particles */}
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />

        {/* Scene 2: Chat demo - phone on right, "Follow the smart money" */}
        <TransitionSeries.Sequence durationInFrames={CHAT_DURATION}>
          <ChatDemoScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />

        {/* Scene 3: Feature montage - "Everything in one chat" */}
        <TransitionSeries.Sequence durationInFrames={FEATURES_DURATION}>
          <FeatureMontage />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION })}
        />

        {/* Scene 4: CTA - "Start trading smarter" */}
        <TransitionSeries.Sequence durationInFrames={CTA_DURATION}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
