/**
 * Film grain — animated SVG turbulence noise with a fresh seed every frame.
 * Critical: seed must change every frame, or it reads as a compression artifact.
 */
export const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'overlay',
        opacity: 0.035,
        pointerEvents: 'none',
        zIndex: 300,
      }}
    >
      <filter id={`grain-${frame}`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves={3}
          seed={frame}
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
    </svg>
  );
};
