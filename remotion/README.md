# Raze Video — Remotion Source

A portrait-format (1080×1920) motion-graphics promo video for raze.fun.
Written with [Remotion](https://www.remotion.dev) — React-based programmatic video.

- **Duration:** 25 s (750 frames @ 30 fps)
- **Format:** 1080×1920 portrait, H.264 MP4
- **Audio:** none (visual-only)
- **Runtime deps:** mascot image at `../../assets/mascot/waving.png` (relative to the `remotion/src/` files)

## Setup

```bash
cd remotion
npm install
```

## Preview in Remotion Studio

```bash
npm start
```

Opens the Remotion Studio at http://localhost:3000 with the `RazeVideo` composition loaded. Scrub the timeline, hot-reload is on.

## Render

```bash
# MP4 (default)
npm run build

# WebM (VP9)
npm run build:webm
```

Output lands in `remotion/out/raze.mp4` (or `.webm`).

## File map

| File | What it does |
|---|---|
| `src/index.ts` | Registers the Remotion root |
| `src/Root.tsx` | Declares the `RazeVideo` composition |
| `src/RazeVideo.tsx` | Top-level scene — camera, scroll, background blend, all layers |
| `src/BackgroundScene.tsx` | Dark gradient + 6 drifting orbs + vignette |
| `src/PhoneChrome.tsx` | Status bar, chat header, composer |
| `src/Bubbles.tsx` | `UserBubble` (typewriter + bounce) and `RazeBubble` (per-line fade) |
| `src/beats.ts` | The 9-beat chat script + scroll-offset timings |
| `src/EndCard.tsx` | Dark overlay + mascot spring + "raze.fun" CTA |
| `src/FilmGrain.tsx` | Animated SVG turbulence overlay (new seed every frame) |
| `src/tokens.ts` | Color/typography/phone-dimension constants |

## Hard invariants

Respect these — the spec calls them out and the rendering depends on them:

1. **Phone chrome must have `opacity: 0` before frame 15.** It materializes during the zoom-out.
2. **`camScale` and `camTranslateY` share the same easing and frame windows.** Decoupling them causes visible drift.
3. **Film-grain seed changes every frame.** A static seed reads as a compression artifact.
4. **Outer-canvas bg at frame 0 is `#f7f7f8`** — identical to the chat screen so the phone edge is invisible.
5. **Phone is 390×844 exactly.** Zoom-anchor math is hard-coded to this aspect ratio.

## Customizing

- **Copy / beats:** edit `src/beats.ts`. If you change beat timings you also need to shift the `SCROLL_STOPS` rows.
- **Brand colors:** `src/tokens.ts` pulls from our design system (`colors_and_type.css`) where applicable.
- **Mascot:** the PNG is already copied to `remotion/public/mascot.png` and referenced as `mascot.png` in `src/tokens.ts`. Swap in your own by overwriting that file.

## Notes

- **No SFX:** per the build request, the audio tracks from the original spec are omitted. To add them later, drop `remotion`'s `<Audio>` components into `RazeVideo.tsx` at the trigger frames listed in the spec.

