import re
from typing import List


def find_natural_cut_point(text: str, target_pos: int, max_search: int = 100) -> int:
    """
    Locate the best boundary (paragraph, sentence, or word) near target_pos.
    Prefers paragraph breaks, then sentence ends, then commas/semicolons, then whitespace.
    """
    length = len(text)
    if target_pos >= length:
        return length

    start_search = max(0, target_pos - max_search)
    window = text[start_search:target_pos]

    # 1. Paragraph break
    para_idx = window.rfind("\n\n")
    if para_idx != -1:
        return start_search + para_idx + 2

    # 2. Sentence boundary (. ! ? followed by whitespace or end)
    sentence_matches = list(re.finditer(r"[\.!\?]\s+", window))
    if sentence_matches:
        last_match = sentence_matches[-1]
        return start_search + last_match.end()

    # 3. Single newline
    nl_idx = window.rfind("\n")
    if nl_idx != -1:
        return start_search + nl_idx + 1

    # 4. Comma, semicolon, or colon
    clause_matches = list(re.finditer(r"[,;:]\s+", window))
    if clause_matches:
        last_match = clause_matches[-1]
        return start_search + last_match.end()

    # 5. Word boundary (whitespace)
    space_idx = window.rfind(" ")
    if space_idx != -1:
        return start_search + space_idx + 1

    return target_pos


def split_text_into_chunks(
    text: str,
    chunk_size: int = 600,
    overlap: int = 120,
) -> List[str]:
    """
    Split text into contextual boundary chunks with overlap.
    Preserves sentences and paragraphs without splitting words in the middle.
    """
    if not text:
        return []

    normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not normalized:
        return []

    if len(normalized) <= chunk_size:
        return [normalized]

    chunks: List[str] = []
    start = 0
    total_len = len(normalized)

    while start < total_len:
        target_end = min(start + chunk_size, total_len)

        if target_end == total_len:
            chunk = normalized[start:target_end].strip()
            if chunk:
                chunks.append(chunk)
            break

        cut_point = find_natural_cut_point(normalized, target_end)

        # Guard against zero progress
        if cut_point <= start:
            cut_point = target_end

        chunk = normalized[start:cut_point].strip()
        if chunk:
            chunks.append(chunk)

        # Calculate next start with overlap
        if cut_point >= total_len:
            break

        overlap_start = max(start + 1, cut_point - overlap)
        # Adjust overlap start forward to the start of the next word to avoid partial words
        next_space = normalized.find(" ", overlap_start, cut_point)
        if next_space != -1 and next_space + 1 < cut_point:
            start = next_space + 1
        else:
            start = overlap_start

    return chunks
