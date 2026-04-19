"""Generate waitlist card images as PNG for sharing."""
import io
import os
import base64
import logging

logger = logging.getLogger(__name__)

# Imp mascot — loaded once at module level
_mascot_b64 = None


def _get_mascot_b64() -> str:
    """Load the imp mascot PNG as base64 for embedding in SVG."""
    global _mascot_b64
    if _mascot_b64:
        return _mascot_b64

    # Try multiple paths
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "imp-expressions", "confident.png"),
        "/app/frontend/public/assets/imp-expressions/confident.png",
        os.path.join(os.path.dirname(__file__), "assets", "confident.png"),
    ]
    for path in paths:
        if os.path.exists(path):
            with open(path, "rb") as f:
                _mascot_b64 = base64.b64encode(f.read()).decode()
                return _mascot_b64

    # Fallback — return empty (card will render without mascot)
    logger.warning("Could not find imp mascot PNG for waitlist card")
    return ""


def _get_tier(position: int) -> tuple[str, str, str]:
    """Get tier info based on position. Returns (badge_text, border_color, badge_bg)."""
    if position <= 50:
        return "OG", "#FFD700", "rgba(255,215,0,0.15)"
    elif position <= 200:
        return "EARLY", "#9945FF", "rgba(153,69,255,0.15)"
    else:
        return "", "#2A2540", "transparent"


def _get_status_text(position: int, referral_count: int) -> str:
    """Get a fun status text based on position and referrals."""
    if referral_count >= 5:
        return "instant access earned 🔑"
    if position <= 10:
        return "almost there 🔥"
    if position <= 50:
        return "OG status 👑"
    if position <= 100:
        return "getting close 📈"
    if position <= 200:
        return "early crew 🫡"
    if referral_count >= 3:
        return "grinding hard 💪"
    if referral_count >= 1:
        return "on the move 🚀"
    return "just joined 🆕"


def generate_waitlist_card(
    username: str,
    position: int,
    referral_count: int,
    total_waitlist: int,
    referral_code: str,
) -> bytes:
    """Generate a waitlist card as PNG bytes.

    Args:
        username: Telegram @username
        position: Queue position
        referral_count: Number of referrals
        total_waitlist: Total people on waitlist
        referral_code: User's referral code

    Returns:
        PNG image bytes
    """
    badge_text, border_color, badge_bg = _get_tier(position)
    status_text = _get_status_text(position, referral_count)
    mascot_b64 = _get_mascot_b64()

    mascot_img = ""
    if mascot_b64:
        mascot_img = f'<image href="data:image/png;base64,{mascot_b64}" x="340" y="30" width="120" height="125" preserveAspectRatio="xMidYMid meet"/>'

    badge_svg = ""
    if badge_text:
        badge_svg = f'''
        <rect x="30" y="30" width="60" height="24" rx="12" fill="{badge_bg}" stroke="{border_color}" stroke-width="1"/>
        <text x="60" y="46" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="700" fill="{border_color}">{badge_text}</text>
        '''

    svg = f'''<svg width="500" height="300" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="500" y2="300">
      <stop offset="0%" stop-color="#0D0B14"/>
      <stop offset="100%" stop-color="#120024"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="#9945FF" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#9945FF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="500" height="300" rx="20" fill="url(#bg)"/>
  <rect width="500" height="300" rx="20" fill="url(#glow)"/>

  <!-- Border -->
  <rect x="1" y="1" width="498" height="298" rx="19" fill="none" stroke="{border_color}" stroke-width="2" stroke-opacity="0.5"/>

  <!-- Badge -->
  {badge_svg}

  <!-- Mascot -->
  {mascot_img}

  <!-- raze branding -->
  <text x="30" y="85" font-family="Space Grotesk, sans-serif" font-size="14" font-weight="600" fill="#9945FF" letter-spacing="0.15em">BETA WAITLIST</text>
  <text x="30" y="115" font-family="Space Grotesk, sans-serif" font-size="32" font-weight="700" fill="#FFFFFF" letter-spacing="-1">raze</text>

  <!-- User info -->
  <text x="30" y="150" font-family="Inter, sans-serif" font-size="16" fill="#C0C0D0">@{username or "anon"}</text>
  <text x="30" y="175" font-family="Inter, sans-serif" font-size="13" fill="#6B6180">{status_text}</text>

  <!-- Stats row -->
  <rect x="30" y="195" width="200" height="50" rx="10" fill="#12101A"/>
  <text x="50" y="215" font-family="JetBrains Mono, monospace" font-size="11" fill="#6B6180">POSITION</text>
  <text x="50" y="234" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="700" fill="#FFFFFF">#{position}</text>

  <rect x="245" y="195" width="200" height="50" rx="10" fill="#12101A"/>
  <text x="265" y="215" font-family="JetBrains Mono, monospace" font-size="11" fill="#6B6180">REFERRALS</text>
  <text x="265" y="234" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="700" fill="#14F195">{referral_count}</text>

  <!-- Referral link -->
  <text x="30" y="275" font-family="JetBrains Mono, monospace" font-size="13" fill="#9945FF">raze.fun/ref/{referral_code}</text>

  <!-- Footer -->
  <text x="470" y="275" text-anchor="end" font-family="Inter, sans-serif" font-size="10" fill="#3A3550">everything solana in one chat</text>
</svg>'''

    # Convert SVG to PNG
    try:
        import cairosvg
        png_bytes = cairosvg.svg2png(
            bytestring=svg.encode("utf-8"),
            output_width=1000,
            output_height=600,
            scale=2,
        )
        return png_bytes
    except ImportError:
        logger.warning("cairosvg not installed — returning SVG as fallback")
        return svg.encode("utf-8")
    except Exception as e:
        logger.error(f"Failed to generate waitlist card: {e}")
        return svg.encode("utf-8")
