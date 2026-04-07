import { Composition } from "remotion";
import { SolanaPromo } from "./SolanaPromo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SolanaPromo"
      component={SolanaPromo}
      durationInFrames={900} // 30 seconds at 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
