import json
import logging
from typing import Any, Dict, Iterator, List
from django.http import HttpRequest, HttpResponse, JsonResponse, StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import DocumentChunk, KnowledgeDocument
from .services import llm, rag

logger = logging.getLogger(__name__)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class ChatView(View):
    """
    Lightweight endpoint supporting both SSE streaming and standard JSON responses.
    No heavy third-party REST frameworks required.
    """

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        try:
            body = json.loads(request.body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({"error": "Invalid JSON payload."}, status=400)

        user_message = body.get("message", "").strip()
        if not user_message:
            return JsonResponse({"error": "Message cannot be empty."}, status=400)

        # Determine target language: explicit parameter, then auto-detection, then request language
        req_lang = body.get("language") or getattr(request, "LANGUAGE_CODE", "en")
        if req_lang not in ("en", "ru", "kk"):
            req_lang = rag.detect_language(user_message, fallback_lang="en")
        else:
            # If user writes in Kazakh but page was English, adapt to Kazakh
            detected = rag.detect_language(user_message, fallback_lang=req_lang)
            if detected == "kk":
                req_lang = "kk"

        # Search knowledge base
        chunks = rag.search_knowledge_base(
            query=user_message,
            language=req_lang,
            top_k=4,
        )

        system_prompt = rag.build_system_prompt(req_lang)
        rag_prompt = rag.assemble_rag_prompt(user_message, chunks, req_lang)

        # Prepare messages payload including limited recent dialogue history
        raw_history: List[Dict[str, str]] = body.get("history", [])
        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

        # Include up to the last 6 messages from browser sessionStorage
        for item in raw_history[-6:]:
            role = item.get("role")
            content = item.get("content", "").strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Append current user prompt augmented with RAG context
        messages.append({"role": "user", "content": rag_prompt})

        wants_stream = body.get("stream", True)
        if wants_stream:
            return self._stream_response(messages, req_lang)

        # Synchronous JSON response fallback
        try:
            answer = llm.generate_chat_response(messages)
            return JsonResponse({"response": answer, "language": req_lang})
        except Exception as exc:
            logger.error("Chat generation failed: %s", exc)
            return JsonResponse(
                {"error": f"Model generation error: {exc}", "language": req_lang},
                status=500,
            )

    def _stream_response(self, messages: List[Dict[str, str]], language: str) -> StreamingHttpResponse:
        """Yield Server-Sent Events (SSE) data stream."""
        def event_stream() -> Iterator[str]:
            try:
                for token in llm.stream_chat_response(messages):
                    data = json.dumps({"token": token, "done": False, "language": language})
                    yield f"data: {data}\n\n"
                done_marker = json.dumps({"token": "", "done": True, "language": language})
                yield f"data: {done_marker}\n\n"
            except Exception as exc:
                logger.error("Streaming failed: %s", exc)
                error_msg = json.dumps({"error": str(exc), "done": True, "language": language})
                yield f"data: {error_msg}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class HealthView(View):
    """Health status endpoint reporting knowledge base size and indexing state."""

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        docs_count = KnowledgeDocument.objects.count()
        indexed_docs = KnowledgeDocument.objects.filter(status="indexed").count()
        chunks_count = DocumentChunk.objects.count()

        return JsonResponse({
            "status": "ok",
            "assistant": "AIstronaut",
            "documents_total": docs_count,
            "documents_indexed": indexed_docs,
            "chunks_total": chunks_count,
        })
