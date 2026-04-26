/**
 * Social video chat beats — 5 exchanges for 1080x1080 square format.
 * Showcases: wallet scan → trace → token research → trending → swap
 * ~18 seconds at 30fps = 540 frames
 */

import type {Beat} from './beats';

export const SOCIAL_BEATS: Beat[] = [
  {
    user: {text: 'scan my wallet', startFrame: 20, cpf: 0.8},
    bot: {
      lines: [
        {text: '$3.3k in stables. 4 dust attacks.', frame: 50},
        {text: '0.03 SOL — one failed tx from broke.', frame: 60},
        {text: 'someone sent you 3,000 USDG yesterday.', frame: 70},
        {text: 'want me to trace who?', frame: 80},
      ],
    },
  },
  {
    user: {text: 'trace it', startFrame: 105, cpf: 1.0},
    bot: {
      lines: [
        {text: 'sender has 10,533 SOL.', frame: 120},
        {text: 'they gave you pocket change.', frame: 130},
        {text: 'full version pings you when they move again.', frame: 140},
      ],
    },
  },
  {
    user: {text: 'check toly.sol', startFrame: 170, cpf: 1.0},
    bot: {
      lines: [
        {text: "toly's sitting on 42k SOL.", frame: 188},
        {text: 'you have 0.03.', frame: 196},
        {text: 'inspirational.', frame: 204},
      ],
    },
  },
  {
    user: {text: "what's trending on solana?", startFrame: 230, cpf: 1.0},
    bot: {
      lines: [
        {text: 'solana rn:', frame: 254},
        {text: 'BONK up 18% \u00b7 JUP governance vote', frame: 264},
        {text: 'WIF dumping \u00b7 pure cope everywhere', frame: 274},
        {text: 'want to ape into any of these?', frame: 284},
      ],
    },
  },
  {
    user: {text: 'swap 1 usdc to sol', startFrame: 310, cpf: 1.0},
    bot: {
      lines: [
        {text: 'bet. 1 USDC \u2192 SOL.', frame: 330},
        {text: 'sign button coming up.', frame: 340},
        {text: 'this is the lite version btw.', frame: 350},
      ],
    },
  },
];

/** Scroll offsets for social video — shorter, tighter. */
export const SOCIAL_SCROLL_STOPS: {start: number; end: number; from: number; to: number}[] = [
  {start: 95, end: 115, from: 0, to: 80},
  {start: 160, end: 180, from: 80, to: 180},
  {start: 220, end: 245, from: 180, to: 310},
  {start: 300, end: 320, from: 310, to: 420},
];
