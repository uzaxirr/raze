/**
 * Chat beat script — 9 user/bot exchanges.
 * Timings per spec, do not modify without updating scroll offsets too.
 */

export type Beat = {
  user: {text: string; startFrame: number; cpf: number};
  bot: {lines: {text: string; frame: number}[]};
};

export const BEATS: Beat[] = [
  {
    user: {text: 'is $WIF safe?', startFrame: 30, cpf: 0.6},
    bot: {
      lines: [
        {text: 'mint revoked ✅ LP burned ✅', frame: 55},
        {text: 'no bundles ✅ top 10 hold 6%', frame: 63},
        {text: 'price $0.2100 · mcap $209M', frame: 70},
        {text: 'sentiment: very bullish 🟢', frame: 76},
        {text: 'score 8/8 — clean af 🔥', frame: 82},
      ],
    },
  },
  {
    user: {text: 'swap 5 SOL to USDC', startFrame: 100, cpf: 1.0},
    bot: {
      lines: [
        {text: 'done. 674.50 usdc.', frame: 116},
        {text: '0.4s via jupiter 🫡', frame: 122},
      ],
    },
  },
  {
    user: {text: 'watch toly.sol', startFrame: 150, cpf: 1.0},
    bot: {
      lines: [
        {text: 'on it 🎯', frame: 163},
        {text: 'toly.sol just swapped 500 SOL → USDC 👀', frame: 170},
        {text: "he's dumping. your call ser", frame: 180},
      ],
    },
  },
  {
    user: {text: 'am i up or down?', startFrame: 210, cpf: 1.0},
    bot: {
      lines: [
        {text: "📈 you're UP $847 this month", frame: 225},
        {text: 'best: BONK +$420  worst: WIF -$89', frame: 232},
        {text: 'not bad ser 🫡', frame: 240},
      ],
    },
  },
  {
    user: {text: 'catch me up on Solana news', startFrame: 258, cpf: 1.0},
    bot: {
      lines: [
        {text: 'solana news tldr 📰', frame: 274},
        {text: 'drift got rekt · $148M rescue fund', frame: 282},
        {text: 'doublezero edge beta live · 28ms faster', frame: 290},
      ],
    },
  },
  {
    user: {text: 'alert me when whales buy BONK', startFrame: 318, cpf: 1.0},
    bot: {
      lines: [
        {text: 'done 🔔 watching buys >$50K', frame: 336},
        {text: 'on jupiter + raydium', frame: 344},
        {text: 'also pinging if SOL hits $100', frame: 352},
      ],
    },
  },
  {
    user: {text: 'decode this tx 4sGjMx...', startFrame: 388, cpf: 1.0},
    bot: {
      lines: [
        {text: 'jupiter swap. clean trade 🫡', frame: 404},
        {text: 'sent 2.5 SOL · got 12,450 BONK', frame: 412},
        {text: 'rate 4,980/SOL · good rate tbh', frame: 420},
      ],
    },
  },
  {
    user: {text: 'check $DOGGO for bundles', startFrame: 458, cpf: 1.0},
    bot: {
      lines: [
        {text: 'bundled 💀', frame: 474},
        {text: '7 wallets · same block on raydium', frame: 482},
        {text: '18% supply · risk: HIGH — stay away', frame: 490},
      ],
    },
  },
  {
    user: {text: "what's this whale buying?", startFrame: 528, cpf: 1.0},
    bot: {
      lines: [
        {text: 'cooking again 🐋', frame: 544},
        {text: '$2.4M bag · 72% win rate', frame: 552},
        {text: 'latest $WIF · last copy: +40% 👀', frame: 560},
      ],
    },
  },
];

/**
 * Scroll offset timing — chat scrolls up as beats accumulate.
 * All uses Easing.bezier(0.4, 0, 0.2, 1).
 */
export const SCROLL_STOPS: {start: number; end: number; from: number; to: number}[] = [
  {start: 95, end: 120, from: 0, to: 90},
  {start: 140, end: 165, from: 90, to: 210},
  {start: 195, end: 220, from: 210, to: 330},
  {start: 255, end: 278, from: 330, to: 450},
  {start: 320, end: 345, from: 450, to: 560},
  {start: 390, end: 415, from: 560, to: 670},
  {start: 460, end: 485, from: 670, to: 780},
  {start: 530, end: 555, from: 780, to: 890},
];
