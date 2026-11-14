import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, Iterator, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """Raised when communication with Ollama LLM fails."""
    pass


def stream_chat_response(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> Iterator[str]:
    """
    Stream tokens from Ollama /api/chat endpoint.
    Yields text chunks as they are generated.
    """
    base_url = getattr(settings, "OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    chat_model = model or getattr(settings, "OLLAMA_CHAT_MODEL", "gemma4:e4b")
    endpoint = f"{base_url}/api/chat"

    payload = json.dumps({
        "model": chat_model,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": temperature,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            for raw_line in response:
                line = raw_line.decode("utf-8").strip()
                if not line:
                    continue
                try:
                    chunk_data = json.loads(line)
                    msg = chunk_data.get("message", {})
                    token = msg.get("content", "")
                    if token:
                        yield token
                    if chunk_data.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
    except urllib.error.URLError as url_err:
        logger.error("Failed to connect to Ollama server at %s: %s", endpoint, url_err)
        raise LLMServiceError(f"Cannot reach Ollama service: {url_err}") from url_err
    except Exception as exc:
        logger.error("Unexpected error during LLM streaming: %s", exc)
        raise LLMServiceError(f"LLM streaming error: {exc}") from exc


def generate_chat_response(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    """
    Generate complete chat response synchronously.
    """
    base_url = getattr(settings, "OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    chat_model = model or getattr(settings, "OLLAMA_CHAT_MODEL", "gemma4:e4b")
    endpoint = f"{base_url}/api/chat"

    payload = json.dumps({
        "model": chat_model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
            msg = data.get("message", {})
            return str(msg.get("content", ""))
    except Exception as exc:
        logger.error("Failed generating chat response: %s", exc)
        raise LLMServiceError(f"LLM generation failed: {exc}") from exc
