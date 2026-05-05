# Raze — Social Video Design System

## Style Prompt
Telegram chat demo — a product in action, not a marketing pitch. The viewer watches a real conversation unfold between a user and the Raze AI agent. Clean, light, editorial. The chat bubbles ARE the content — everything else recedes. The mascot adds personality without dominating. Feels like someone screen-recorded their Telegram and added polish.

## Colors
- `#F4EFFF` — background (light lavender, matches landing page mid-gradient)
- `#FFFFFF` — bot bubble background
- `rgba(153,69,255,0.12)` — user bubble background (translucent purple)
- `#9945FF` — primary accent (brand purple, used for avatars, highlights)
- `#6B2FD4` — user bubble text (dark purple)
- `#1A0A2E` — bot text (warm near-black)
- `#9A85B8` — muted/secondary text
- `#14F195` — success green (sparingly, for confirmations)

## Typography
- **Inter** — chat text. Yes, it's banned in house-style, but this is a Telegram mockup — Inter IS the product font. Intentional.
- **Space Grotesk 700** — wordmark "raze.fun" on end card only

## Motion
- Chat bubbles slide up + fade in (power2.out, 0.4s)
- User typing: character-by-character at 60ms intervals
- Typing indicator: 3 dots bouncing in sequence (0.3s cycle)
- Between bubbles: 0.8-1.2s pause with typing indicator
- End card: crossfade from chat, elements stagger in

## What NOT to Do
- No gradient text
- No neon glows or dark theme
- No generic "AI" imagery
- No phone frame — just floating bubbles
- No exit animations before transitions
- Don't make it feel like an ad — make it feel like a screen recording with polish
