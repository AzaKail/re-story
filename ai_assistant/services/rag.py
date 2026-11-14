import math
import re
from typing import List, Optional, Tuple
from django.db.models import QuerySet
from pgvector.django import CosineDistance

from ..models import DocumentChunk, check_native_pgvector
from .embeddings import get_embedding


def detect_language(text: str, fallback_lang: str = "en") -> str:
    """
    Detect language (en, ru, kk) based on character patterns.
    """
    if not text:
        return fallback_lang

    # Kazakh specific Cyrillic characters
    kazakh_chars = set("әғқңөұүһіӘҒҚҢӨҰҮҺІ")
    if any(char in kazakh_chars for char in text):
        return "kk"

    # General Cyrillic characters indicate Russian
    cyrillic_count = len(re.findall(r"[а-яА-ЯёЁ]", text))
    latin_count = len(re.findall(r"[a-zA-Z]", text))

    if cyrillic_count > latin_count:
        return "ru"
    if latin_count > 0:
        return "en"

    return fallback_lang


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Compute cosine similarity between two float vectors.
    Returns a score between -1.0 and 1.0.
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def search_knowledge_base(
    query: str,
    language: Optional[str] = None,
    top_k: int = 4,
    min_similarity: float = 0.25,
) -> List[Tuple[DocumentChunk, float]]:
    """
    Search relevant document chunks using vector cosine similarity.
    Uses native pgvector distance operator when available, or pure Python fallback.
    """
    if not query.strip():
        return []

    try:
        query_vec = get_embedding(query)
    except Exception:
        return []

    # Filter base queryset by indexed documents and optional language
    base_qs = DocumentChunk.objects.filter(
        document__status="indexed",
        embedding__isnull=False,
    ).select_related("document")

    lang_qs = base_qs.filter(document__language=language) if language else base_qs
    # If no documents exist for the specific language, search across all documents
    if language and not lang_qs.exists() and base_qs.exists():
        target_qs = base_qs
    else:
        target_qs = lang_qs

    if check_native_pgvector():
        # Native pgvector cosine distance: distance = 1 - cosine_similarity
        chunks_with_distance = (
            target_qs.annotate(distance=CosineDistance("embedding", query_vec))
            .order_by("distance")[:top_k]
        )
        results: List[Tuple[DocumentChunk, float]] = []
        for chunk in chunks_with_distance:
            dist = getattr(chunk, "distance", 1.0)
            similarity = 1.0 - float(dist)
            if similarity >= min_similarity:
                results.append((chunk, similarity))
        return results

    # Python-based cosine similarity fallback
    candidates: List[Tuple[DocumentChunk, float]] = []
    for chunk in target_qs:
        chunk_vec = chunk.embedding
        if chunk_vec:
            sim = compute_cosine_similarity(query_vec, chunk_vec)
            if sim >= min_similarity:
                candidates.append((chunk, sim))

    candidates.sort(key=lambda item: item[1], reverse=True)
    return candidates[:top_k]


def build_system_prompt(language: str) -> str:
    """
    Construct system instructions for AIstronaut in the required language.
    No em-dashes and no emojis are used in system prompt.
    """
    if language == "ru":
        return (
            "Вы - AIstronaut, интеллектуальный космический гид и ассистент интерактивного музея Silent Pioneers. "
            "Ваша задача - отвечать на вопросы посетителей об оборудовании и миссиях NASA на Луне и Марсе. "
            "Правила работы:\n"
            "1. Опирайтесь исключительно на предоставленный контекст из базы знаний.\n"
            "2. Строго запрещено придумывать факты, даты, технические характеристики или имена, которых нет в контексте.\n"
            "3. Если в предоставленном контексте нет ответа на вопрос, вежливо и прямо скажите: "
            "'К сожалению, в архивах музея Silent Pioneers нет информации по данному вопросу.'\n"
            "4. Отвечайте строго на русском языке, грамотно, структурированно и лаконично.\n"
            "5. Не используйте эмодзи и длинные тире."
        )

    if language == "kk":
        return (
            "Сіз - AIstronaut, Silent Pioneers интерактивті мұражайының зияткерлік ғарыштық гидісіз. "
            "Сіздің мақсатыңыз - келушілердің Ай мен Марстағы NASA миссиялары мен қалдырылған құрылғылары туралы сұрақтарына жауап беру. "
            "Жұмыс ережелері:\n"
            "1. Тек білім базасынан берілген контекстке сүйеніңіз.\n"
            "2. Контексте жоқ деректерді, күндерді немесе техникалық ақпаратты ойдан шығаруға қатаң тыйым салынады.\n"
            "3. Егер берілген контексте жауап болмаса, сыпайы түрде: "
            "'Өкінішке орай, Silent Pioneers мұражайының мұрағатында бұл сұрақ бойынша мәлімет жоқ.' деп жауап беріңіз.\n"
            "4. Тек қазақ тілінде, сауатты әрі нақты жауап беріңіз.\n"
            "5. Эмодзи мен ұзын сызықшаларды қолданбаңыз."
        )

    return (
        "You are AIstronaut, the intelligent space guide and assistant for the Silent Pioneers museum. "
        "Your mission is to answer questions about NASA equipment, lunar and Martian missions, and historical artifacts. "
        "Operating guidelines:\n"
        "1. Base your answers strictly on the retrieved knowledge base context.\n"
        "2. Do not hallucinate, speculate, or invent any dates, technical specifications, or facts not present in the context.\n"
        "3. If the context does not contain enough information to answer the question, clearly state: "
        "'Unfortunately, the Silent Pioneers museum archives do not contain information on this topic.'\n"
        "4. Respond strictly in English in a clear, concise, and professional tone.\n"
        "5. Do not use emojis or em-dashes."
    )


def assemble_rag_prompt(query: str, chunks_with_scores: List[Tuple[DocumentChunk, float]], language: str) -> str:
    """
    Format user question alongside retrieved context chunks into a prompt.
    """
    if not chunks_with_scores:
        if language == "ru":
            return (
                f"Вопрос пользователя: {query}\n\n"
                "Контекст из базы знаний: [Информация в базе знаний отсутствует].\n\n"
                "Ответьте посетителю согласно инструкциям."
            )
        if language == "kk":
            return (
                f"Пайдаланушы сұрағы: {query}\n\n"
                "Білім базасының мәтіні: [Мәліметтер табылмады].\n\n"
                "Нұсқаулыққа сәйкес жауап беріңіз."
            )
        return (
            f"User question: {query}\n\n"
            "Knowledge base context: [No relevant context found in database].\n\n"
            "Answer according to system instructions."
        )

    context_parts: List[str] = []
    for idx, (chunk, score) in enumerate(chunks_with_scores, start=1):
        context_parts.append(f"[{idx}] Source: {chunk.document.title}\n{chunk.content}")

    context_block = "\n\n".join(context_parts)

    if language == "ru":
        return (
            f"Контекст из архивов музея:\n{context_block}\n\n"
            f"Вопрос пользователя: {query}\n\n"
            "Дайте точный и краткий ответ на основе приведенного выше контекста."
        )
    if language == "kk":
        return (
            f"Мұражай мұрағатынан мәліметтер:\n{context_block}\n\n"
            f"Пайдаланушы сұрағы: {query}\n\n"
            "Жоғарыда көрсетілген мәліметтерге сүйене отырып, нақты жауап беріңіз."
        )
    return (
        f"Context from museum archives:\n{context_block}\n\n"
        f"User question: {query}\n\n"
        "Provide an accurate and concise answer based exclusively on the context above."
    )
