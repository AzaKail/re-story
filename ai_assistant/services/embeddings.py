import json
import logging
import urllib.error
import urllib.request
from typing import List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class EmbeddingServiceError(Exception):
    """Raised when embedding generation fails."""
    pass


def get_embedding(text: str, model: Optional[str] = None) -> List[float]:
    """
    Generate embedding vector for a single text using Ollama.
    """
    if not text or not text.strip():
        raise EmbeddingServiceError("Cannot generate embedding for empty text.")

    base_url = getattr(settings, "OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    embed_model = model or getattr(settings, "OLLAMA_EMBED_MODEL", "nomic-embed-text")
    embed_num_gpu = getattr(settings, "OLLAMA_EMBED_NUM_GPU", 0)
    keep_alive = getattr(settings, "OLLAMA_KEEP_ALIVE", "1h")
    clean_text = text.strip()

    # Try /api/embeddings first (standard Ollama embeddings endpoint)
    endpoint_embeddings = f"{base_url}/api/embeddings"
    payload = json.dumps({
        "model": embed_model,
        "prompt": clean_text,
        "keep_alive": keep_alive,
        "options": {
            "num_gpu": embed_num_gpu,
        },
    }).encode("utf-8")
    req = urllib.request.Request(
        endpoint_embeddings,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            vector = data.get("embedding")
            if vector and isinstance(vector, list):
                return [float(x) for x in vector]
            raise EmbeddingServiceError("Ollama response missing 'embedding' field.")
    except urllib.error.HTTPError as http_err:
        # Fallback to modern /api/embed if /api/embeddings returned an error
        error_body = http_err.read().decode("utf-8", errors="ignore")
        logger.warning(
            "Endpoint /api/embeddings returned HTTP %s: %s. Trying /api/embed.",
            http_err.code,
            error_body,
        )
        return _get_embedding_via_embed_endpoint(base_url, embed_model, clean_text)
    except Exception as exc:
        raise EmbeddingServiceError(
            f"Failed to generate embedding from Ollama at {base_url}: {exc}"
        ) from exc


def _get_embedding_via_embed_endpoint(base_url: str, model: str, text: str) -> List[float]:
    """Fallback to /api/embed endpoint for newer Ollama builds."""
    embed_num_gpu = getattr(settings, "OLLAMA_EMBED_NUM_GPU", 0)
    keep_alive = getattr(settings, "OLLAMA_KEEP_ALIVE", "1h")
    endpoint_embed = f"{base_url}/api/embed"
    payload = json.dumps({
        "model": model,
        "input": text,
        "keep_alive": keep_alive,
        "options": {
            "num_gpu": embed_num_gpu,
        },
    }).encode("utf-8")
    req = urllib.request.Request(
        endpoint_embed,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            embeddings = data.get("embeddings")
            if embeddings and isinstance(embeddings, list) and len(embeddings) > 0:
                return [float(x) for x in embeddings[0]]
            raise EmbeddingServiceError("Ollama /api/embed response missing 'embeddings' field.")
    except Exception as exc:
        raise EmbeddingServiceError(
            f"Failed calling /api/embed for model '{model}': {exc}"
        ) from exc


def get_embeddings_batch(texts: List[str], model: Optional[str] = None) -> List[List[float]]:
    """
    Generate embedding vectors for a list of texts sequentially or in batches.
    """
    results: List[List[float]] = []
    for text in texts:
        results.append(get_embedding(text, model=model))
    return results
