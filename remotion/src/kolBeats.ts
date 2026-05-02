/**
 * KOL Unanswered DM — Raze chat beats (5 exchanges).
 *
 * Each mirrors an unanswered question from the Twitter section.
 * Responses use Raze's actual voice: lowercase, sarcastic, data-rich.
 *
 * Frame budget: Part 2 starts at frame 410 (after transition).
 */

import type {Beat} from './beats';

export const KOL_BEATS: Beat[] = [
  // Beat 1 — Token Safety (mirrors Ansem's unanswered "is WIF safe?")
  {
    user: {text: 'is $WIF safe to buy at 2.3?', startFrame: 430, cpf: 0.8},
    bot: {
      lines: [
        {text: 'just scanned it for you 🔍', frame: 460},
        {text: 'mint revoked ✅ LP burned ✅ no bundles', frame: 468},
        {text: 'top 10 wallets hold 6% — no dump risk', frame: 476},
        {text: '$2.10 · $209M mcap · bullish sentiment 🟢', frame: 484},
        {text: '8/8 score. safe to enter at 2.3 ser 🔥', frame: 492},
      ],
    },
  },
  // Beat 2 — Rug Save (mirrors "got rugged on the last one")
  {
    user: {text: 'what about $DOGGO? got shilled in a gc', startFrame: 525, cpf: 0.8},
    bot: {
      lines: [
        {text: 'oh hell no 💀', frame: 555},
        {text: '7 wallets bought same block on raydium', frame: 563},
        {text: '18% supply in one cluster. textbook rug', frame: 571},
        {text: 'whoever shilled this is not your friend 🚫', frame: 579},
      ],
    },
  },
  // Beat 3 — Whale Stalking (alpha no KOL would share)
  {
    user: {text: 'who\'s the smart money buying WIF?', startFrame: 615, cpf: 0.8},
    bot: {
      lines: [
        {text: 'found one 🐋 $2.4M bag', frame: 645},
        {text: '72% win rate across 340 trades', frame: 653},
        {text: 'bought 50K WIF at $2.08 three hours ago', frame: 661},
        {text: 'his last 5 picks averaged +40% 👀', frame: 669},
      ],
    },
  },
  // Beat 4 — Portfolio Roast (personalized, nobody else can do this)
  {
    user: {text: 'how\'s my portfolio looking?', startFrame: 700, cpf: 0.9},
    bot: {
      lines: [
        {text: "up $847 this month. not bad 📈", frame: 726},
        {text: 'best: WIF +$420 · worst: BONK -$89', frame: 734},
        {text: 'but ser... 62% memecoins??', frame: 742},
        {text: 'one rug and your whole bag evaporates 💀', frame: 750},
      ],
    },
  },
  // Beat 5 — Instant Swap + KOL callback
  {
    user: {text: 'lol fair. swap 2 SOL to WIF', startFrame: 780, cpf: 0.9},
    bot: {
      lines: [
        {text: 'done. 19,047 WIF 🫡', frame: 805},
        {text: '0.3s via jupiter. in your wallet already', frame: 813},
      ],
    },
  },
];

export const KOL_SCROLL_STOPS: {start: number; end: number; from: number; to: number}[] = [
  {start: 520, end: 540, from: 0, to: 110},
  {start: 610, end: 630, from: 110, to: 230},
  {start: 695, end: 715, from: 230, to: 360},
  {start: 775, end: 795, from: 360, to: 470},
];
