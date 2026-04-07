#!/usr/bin/env python3
"""
Market Research MCP Server
Provides social sentiment and news data via LunarCrush API for data-backed decisions.
"""
import os
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from fastmcp import FastMCP
from dotenv import load_dotenv
import httpx

# Load from the project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Configuration
CONFIG = {
    'api_key': os.getenv('LUNARCRUSH_API_KEY'),
    'base_url': 'https://lunarcrush.com/api4',
    'timeout': int(os.getenv('LUNARCRUSH_TIMEOUT', '8')),  # Must fit within MCP's 10s timeout
    'debug': os.getenv('DEBUG', 'false').lower() == 'true'
}

if not CONFIG['api_key']:
    raise ValueError("LUNARCRUSH_API_KEY is required. Set it in .env file")

mcp = FastMCP(name="market-research")


async def _make_request(endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
    """Make authenticated request to LunarCrush API."""
    headers = {
        'Authorization': f"Bearer {CONFIG['api_key']}",
        'Accept': 'application/json'
    }
    url = f"{CONFIG['base_url']}{endpoint}"

    async with httpx.AsyncClient(timeout=CONFIG['timeout']) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()


def _normalize_topic(topic: str) -> str:
    """Normalize topic to LunarCrush format (lowercase, allowed chars only)."""
    # LunarCrush topics: lowercase, letters, numbers, spaces, #, $ only
    normalized = topic.lower().strip()
    # Keep only allowed characters
    allowed = set('abcdefghijklmnopqrstuvwxyz0123456789 #$')
    normalized = ''.join(c for c in normalized if c in allowed)
    return normalized.strip()


def _sentiment_label(score: float) -> str:
    """Convert 1-5 sentiment score to human label."""
    if score >= 4.5:
        return "very bullish"
    elif score >= 3.5:
        return "bullish"
    elif score >= 2.5:
        return "neutral"
    elif score >= 1.5:
        return "bearish"
    else:
        return "very bearish"


@mcp.tool()
async def get_topic_news(
    topic: str,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Get recent news articles for a topic with sentiment analysis.

    Args:
        topic: Topic to research (e.g., "trump", "bitcoin", "fed rate cut")
        limit: Max articles to return (1-50)

    Returns:
        News articles with headlines, sources, sentiment scores, and engagement
    """
    try:
        normalized = _normalize_topic(topic)
        if not normalized:
            return {"status": "error", "error": "Invalid topic - must contain letters/numbers"}

        data = await _make_request(f"/public/topic/{normalized}/news/v1")

        if not data or 'data' not in data:
            return {
                "status": "success",
                "topic": topic,
                "news": [],
                "count": 0,
                "message": f"No news found for '{topic}'"
            }

        articles = data.get('data', [])[:min(limit, 50)]

        formatted = []
        sentiment_sum = 0
        sentiment_count = 0

        for article in articles:
            sentiment = article.get('post_sentiment')
            if sentiment:
                sentiment_sum += sentiment
                sentiment_count += 1

            formatted.append({
                "title": article.get('post_title'),
                "url": article.get('post_link'),
                "source": article.get('creator_name'),
                "sentiment": sentiment,
                "sentiment_label": _sentiment_label(sentiment) if sentiment else None,
                "interactions_24h": article.get('interactions_24h'),
                "published": article.get('post_created'),
            })

        avg_sentiment = round(sentiment_sum / sentiment_count, 2) if sentiment_count > 0 else None

        return {
            "status": "success",
            "topic": topic,
            "news": formatted,
            "count": len(formatted),
            "avg_sentiment": avg_sentiment,
            "avg_sentiment_label": _sentiment_label(avg_sentiment) if avg_sentiment else None,
        }

    except httpx.HTTPStatusError as e:
        return {"status": "error", "error": f"API error: {e.response.status_code}"}
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@mcp.tool()
async def get_topic_posts(
    topic: str,
    limit: int = 15
) -> Dict[str, Any]:
    """
    Get social media posts (Twitter, YouTube, Reddit, TikTok) for a topic.

    Args:
        topic: Topic to research (e.g., "solana", "polymarket", "election")
        limit: Max posts to return (1-50)

    Returns:
        Social posts with content, sentiment, engagement metrics, creator info
    """
    try:
        normalized = _normalize_topic(topic)
        if not normalized:
            return {"status": "error", "error": "Invalid topic - must contain letters/numbers"}

        data = await _make_request(f"/public/topic/{normalized}/posts/v1")

        if not data or 'data' not in data:
            return {
                "status": "success",
                "topic": topic,
                "posts": [],
                "count": 0,
                "message": f"No posts found for '{topic}'"
            }

        posts = data.get('data', [])[:min(limit, 50)]

        formatted = []
        sentiment_sum = 0
        sentiment_count = 0
        total_interactions = 0

        for post in posts:
            sentiment = post.get('post_sentiment')
            if sentiment:
                sentiment_sum += sentiment
                sentiment_count += 1

            interactions = post.get('interactions_total', 0) or 0
            total_interactions += interactions

            formatted.append({
                "type": post.get('post_type'),  # tweet, youtube-video, reddit-post, tiktok-video
                "content": (post.get('post_title', '') or '')[:280],  # Truncate long content
                "sentiment": sentiment,
                "sentiment_label": _sentiment_label(sentiment) if sentiment else None,
                "interactions_total": interactions,
                "interactions_24h": post.get('interactions_24h'),
                "creator_followers": post.get('creator_followers'),
            })

        avg_sentiment = round(sentiment_sum / sentiment_count, 2) if sentiment_count > 0 else None

        # Count by type
        type_breakdown = {}
        for p in formatted:
            t = p.get('type', 'unknown')
            type_breakdown[t] = type_breakdown.get(t, 0) + 1

        return {
            "status": "success",
            "topic": topic,
            "posts": formatted,
            "count": len(formatted),
            "avg_sentiment": avg_sentiment,
            "avg_sentiment_label": _sentiment_label(avg_sentiment) if avg_sentiment else None,
            "total_interactions": total_interactions,
            "type_breakdown": type_breakdown,
        }

    except httpx.HTTPStatusError as e:
        return {"status": "error", "error": f"API error: {e.response.status_code}"}
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@mcp.tool()
async def get_topic_summary(
    topic: str
) -> Dict[str, Any]:
    """
    Get aggregated sentiment and metrics summary for a topic.
    Combines news + social data for a quick overview.

    Args:
        topic: Topic to research (e.g., "bitcoin etf", "trump", "interest rates")

    Returns:
        Aggregated sentiment score, interaction volume, and quick take
    """
    try:
        normalized = _normalize_topic(topic)
        if not normalized:
            return {"status": "error", "error": "Invalid topic - must contain letters/numbers"}

        # Fetch both news and posts in parallel to fit within timeout
        news_data, posts_data = await asyncio.gather(
            _make_request(f"/public/topic/{normalized}/news/v1"),
            _make_request(f"/public/topic/{normalized}/posts/v1"),
            return_exceptions=True
        )
        # Handle any exceptions from parallel calls
        if isinstance(news_data, Exception):
            news_data = None
        if isinstance(posts_data, Exception):
            posts_data = None

        news_items = news_data.get('data', []) if news_data else []
        post_items = posts_data.get('data', []) if posts_data else []

        if not news_items and not post_items:
            return {
                "status": "success",
                "topic": topic,
                "message": f"No data found for '{topic}'",
                "has_data": False
            }

        # Calculate news sentiment
        news_sentiments = [n.get('post_sentiment') for n in news_items if n.get('post_sentiment')]
        news_avg = sum(news_sentiments) / len(news_sentiments) if news_sentiments else None

        # Calculate social sentiment (weighted by interactions)
        social_weighted_sum = 0
        social_weight_total = 0
        total_interactions = 0

        for post in post_items:
            sentiment = post.get('post_sentiment')
            interactions = post.get('interactions_total', 1) or 1
            if sentiment:
                social_weighted_sum += sentiment * interactions
                social_weight_total += interactions
            total_interactions += post.get('interactions_24h', 0) or 0

        social_avg = social_weighted_sum / social_weight_total if social_weight_total > 0 else None

        # Combined sentiment (news + social equally weighted)
        sentiments = [s for s in [news_avg, social_avg] if s is not None]
        combined = round(sum(sentiments) / len(sentiments), 2) if sentiments else None

        # Generate quick take
        quick_take = None
        if combined:
            if combined >= 4.0:
                quick_take = "sentiment is very bullish - crowd is hyped"
            elif combined >= 3.5:
                quick_take = "sentiment leaning bullish - generally positive vibes"
            elif combined >= 2.5:
                quick_take = "sentiment is mixed/neutral - no clear consensus"
            elif combined >= 2.0:
                quick_take = "sentiment leaning bearish - some concerns out there"
            else:
                quick_take = "sentiment is very bearish - crowd is worried"

        return {
            "status": "success",
            "topic": topic,
            "has_data": True,
            "combined_sentiment": combined,
            "combined_sentiment_label": _sentiment_label(combined) if combined else None,
            "news_sentiment": round(news_avg, 2) if news_avg else None,
            "social_sentiment": round(social_avg, 2) if social_avg else None,
            "news_count": len(news_items),
            "posts_count": len(post_items),
            "interactions_24h": total_interactions,
            "quick_take": quick_take,
        }

    except httpx.HTTPStatusError as e:
        return {"status": "error", "error": f"API error: {e.response.status_code}"}
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@mcp.tool()
async def get_trending_topics(
    limit: int = 10
) -> Dict[str, Any]:
    """
    Get currently trending social topics.
    Useful for discovering what's hot right now.

    Args:
        limit: Max topics to return (1-50)

    Returns:
        Trending topics with rank, interaction counts
    """
    try:
        data = await _make_request("/public/topics/list/v1")

        if not data or 'data' not in data:
            return {
                "status": "success",
                "topics": [],
                "count": 0,
                "message": "No trending topics available"
            }

        topics = data.get('data', [])[:min(limit, 50)]

        formatted = []
        for i, topic in enumerate(topics, 1):
            formatted.append({
                "rank": i,
                "topic": topic.get('topic') or topic.get('name'),
                "interactions_24h": topic.get('interactions_24h'),
                "posts_24h": topic.get('posts_24h'),
            })

        return {
            "status": "success",
            "topics": formatted,
            "count": len(formatted),
        }

    except httpx.HTTPStatusError as e:
        return {"status": "error", "error": f"API error: {e.response.status_code}"}
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    if CONFIG['debug']:
        print(f"Starting {mcp.name} server...")
    mcp.run()


if __name__ == "__main__":
    main()
