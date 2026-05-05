/**
 * Design tokens sourced from raze.fun design system where applicable;
 * spec values override when they differ.
 */
export const colors = {
  // Brand
  purple: '#9945FF',
  purpleDark: '#7B2FE0',
  purpleGlow: 'rgba(153, 69, 255, 0.4)',
  purpleSoft: 'rgba(153, 69, 255, 0.18)',
  purpleShimmer: 'rgba(153, 69, 255, 0.05)',

  // Dark backdrop — per spec
  bgDarkA: '#0a0a0f',
  bgDarkB: '#0e0818',
  bgDarkC: '#12082a',
  bgVignette: 'rgba(5, 3, 12, 0.55)',

  // Light Telegram chat surfaces
  chatBg: '#f7f7f8',
  headerBg: '#ffffff',
  divider: 'rgba(0,0,0,0.08)',
  bubbleBot: '#f0f0f5',
  bubbleUser: '#007AFF',
  bubbleUserMeta: 'rgba(255,255,255,0.6)',
  bubbleBotMeta: 'rgba(0,0,0,0.3)',

  // Phone chrome
  phoneFrame: '#1a1a1a',
  phoneFrameEdge: '#2a2a2a',
  phoneScreen: '#f7f7f8',

  // Text
  textPrimary: '#111',
  textSecondary: '#999',
};

export const typography = {
  stack:
    '-apple-system, system-ui, "Inter", BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

// Phone dimensions (spec — do NOT change; zoom math depends on these)
export const phone = {
  W: 390,
  H: 844,
  BEZEL: 12,
  STATUS_H: 50,
  HEADER_H: 52,
  TOTAL_HEADER: 102,
  COMPOSER_H: 60,
  CORNER_OUTER: 56,
  CORNER_SCREEN: 44,
};

// Camera choreography frame stops (spec)
export const camera = {
  HOLD_END: 15,
  ZOOM_END: 45,
  ZOOM2_START: 410,
  ZOOM2_END: 430,
  END_START: 610,
};

import {staticFile} from 'remotion';

// Remotion serves everything in `remotion/public/` at the site root.
export const mascotSrc = staticFile('mascot.png');
