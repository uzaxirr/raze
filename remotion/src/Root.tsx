import {Composition} from 'remotion';
import {RazeVideo} from './RazeVideo';
import {RazePromo} from './RazePromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RazeVideo"
        component={RazeVideo}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RazePromo"
        component={RazePromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
