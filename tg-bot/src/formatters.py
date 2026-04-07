"""
Telegram message formatting using MessageEntity for reliable formatting.
No escaping needed - just calculate UTF-16 offsets.
"""

import re
from typing import NamedTuple

from telegram import MessageEntity

from .config import config


class ParsedMessage(NamedTuple):
    """Result of parsing markdown to plain text + entities."""
    text: str
    entities: list[MessageEntity]


def utf16_len(text: str) -> int:
    """Calculate UTF-16 code unit length (Telegram uses UTF-16 offsets)."""
    return len(text.encode('utf-16-le')) // 2


def utf16_offset(text: str, char_index: int) -> int:
    """Convert character index to UTF-16 offset."""
    return utf16_len(text[:char_index])


def parse_markdown_to_entities(text: str) -> ParsedMessage:
    """
    Parse markdown text to plain text + MessageEntity list.

    Supported formats:
    - **bold** or __bold__
    - *italic* or _italic_
    - `inline code`
    - ```code blocks```
    - [text](url) links

    Returns:
        ParsedMessage with (plain_text, entities)
    """
    if not text:
        return ParsedMessage("", [])

    entities: list[MessageEntity] = []

    # Track replacements to adjust positions
    # We'll process markers and build clean text

    # Pattern order matters - process in specific order to avoid conflicts

    # 1. Code blocks first (```...```)
    code_block_pattern = r'```(?:\w+\n)?([\s\S]*?)```'

    # 2. Inline code (`...`)
    inline_code_pattern = r'`([^`]+)`'

    # 3. Links [text](url)
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'

    # 4. Bold (**text** or __text__)
    bold_pattern = r'\*\*(.+?)\*\*|__(.+?)__'

    # 5. Italic (*text* or _text_) - single markers
    italic_pattern = r'(?<![*_])\*([^*]+?)\*(?![*_])|(?<![*_])_([^_]+?)_(?![*_])'

    # Process in multiple passes, tracking position shifts
    result_text = text
    offset_adjustment = 0

    # Helper to create entity and track adjustment
    def process_match(match, entity_type: str, group_idx: int = 1, url: str = None):
        nonlocal result_text, offset_adjustment

        start = match.start()
        content = match.group(group_idx)
        if content is None and group_idx == 1:
            content = match.group(2)  # Try alternate group

        if content is None:
            return

        # Calculate UTF-16 offset in the CURRENT result_text
        utf16_start = utf16_offset(result_text, start)
        utf16_length = utf16_len(content)

        # Create entity
        if entity_type == "text_link" and url:
            entities.append(MessageEntity(
                type=entity_type,
                offset=utf16_start,
                length=utf16_length,
                url=url
            ))
        elif entity_type == "pre":
            entities.append(MessageEntity(
                type=entity_type,
                offset=utf16_start,
                length=utf16_length,
            ))
        else:
            entities.append(MessageEntity(
                type=entity_type,
                offset=utf16_start,
                length=utf16_length
            ))

        # Replace matched text with just the content
        result_text = result_text[:start] + content + result_text[match.end():]

    # Pass 1: Code blocks
    while True:
        match = re.search(code_block_pattern, result_text)
        if not match:
            break
        process_match(match, "pre")

    # Pass 2: Inline code
    while True:
        match = re.search(inline_code_pattern, result_text)
        if not match:
            break
        process_match(match, "code")

    # Pass 3: Links
    while True:
        match = re.search(link_pattern, result_text)
        if not match:
            break
        url = match.group(2)
        start = match.start()
        link_text = match.group(1)

        utf16_start = utf16_offset(result_text, start)
        utf16_length = utf16_len(link_text)

        entities.append(MessageEntity(
            type="text_link",
            offset=utf16_start,
            length=utf16_length,
            url=url
        ))

        result_text = result_text[:start] + link_text + result_text[match.end():]

    # Pass 4: Bold
    while True:
        match = re.search(bold_pattern, result_text)
        if not match:
            break
        content = match.group(1) or match.group(2)
        start = match.start()

        utf16_start = utf16_offset(result_text, start)
        utf16_length = utf16_len(content)

        entities.append(MessageEntity(
            type="bold",
            offset=utf16_start,
            length=utf16_length
        ))

        result_text = result_text[:start] + content + result_text[match.end():]

    # Pass 5: Italic
    while True:
        match = re.search(italic_pattern, result_text)
        if not match:
            break
        content = match.group(1) or match.group(2)
        start = match.start()

        utf16_start = utf16_offset(result_text, start)
        utf16_length = utf16_len(content)

        entities.append(MessageEntity(
            type="italic",
            offset=utf16_start,
            length=utf16_length
        ))

        result_text = result_text[:start] + content + result_text[match.end():]

    # Sort entities by offset for consistency
    entities.sort(key=lambda e: e.offset)

    return ParsedMessage(result_text, entities)


def truncate_message(text: str, max_length: int | None = None) -> str:
    """Truncate message to fit Telegram's limit."""
    limit = max_length or config.MAX_MESSAGE_LENGTH

    if len(text) <= limit:
        return text

    # Truncate and add ellipsis
    truncated = text[:limit - 20]

    # Try to break at a word boundary
    last_space = truncated.rfind(" ")
    if last_space > limit - 100:
        truncated = truncated[:last_space]

    return truncated + "\n\n... (truncated)"


def format_simple(text: str) -> str:
    """Strip all markdown formatting for plain text fallback."""
    if not text:
        return ""

    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'__(.+?)__', r'\1', text)  # Alt bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)  # Italic
    text = re.sub(r'_(.+?)_', r'\1', text)  # Alt italic
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # Headers
    text = re.sub(r'```[\w]*\n?', '', text)  # Code block markers
    text = re.sub(r'`([^`]+)`', r'\1', text)  # Inline code
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # Links

    return text
