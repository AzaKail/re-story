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
    Hybrid mode: prioritizes knowledge base context while allowing model weights
    to answer space/NASA questions when context is missing or incomplete.
    No em-dashes and no emojis are used in system prompt.
    """
    if language == "ru":
        return (
            "Вы - AIstronaut, интеллектуальный космический гид и ассистент интерактивного 3D-музея. "
            "Ваша задача - отвечать на вопросы посетителей об оборудовании и миссиях NASA, исследовании Луны, Марса и космоса.\n"
            "Правила работы:\n"
            "1. Приоритет базы знаний: если к вопросу прикреплен контекст из архивов музея, опирайтесь в первую очередь на него.\n"
            "2. Собственные знания: если информации в предоставленном контексте не хватает или она отсутствует, "
            "используйте свои обширные знания по астрономии, космонавтике и истории миссий NASA, чтобы дать содержательный и точный ответ.\n"
            "3. Если информации по конкретному экспонату пока нет в базе музея, кратко отметьте, что подробные данные еще не загружены в память, "
            "и ответьте на основе общих сведений NASA и космических исследований.\n"
            "4. Отвечайте строго на русском языке, емко, увлекательно и лаконично (не более 2-3 коротких абзацев), выделяя только самое главное.\n"
            "5. Не используйте эмодзи и длинные тире."
        )

    if language == "kk":
        return (
            "Сіз - AIstronaut, интерактивті 3D мұражайдың зияткерлік ғарыштық гидісіз. "
            "Сіздің мақсатыңыз - келушілердің NASA миссиялары, Ай мен Марсты зерттеу, ғарыштық құрылғылар туралы сұрақтарына жауап беру.\n"
            "Жұмыс ережелері:\n"
            "1. Білім базасының басымдығы: егер мұражай мұрағатынан контекст берілсе, ең алдымен соған сүйеніңіз.\n"
            "2. Өз біліміңіз: егер берілген контексте мәлімет жеткіліксіз болса немесе мүлдем болмаса, "
            "мазмұнды әрі нақты жауап беру үшін астрономия, ғарыш және NASA тарихы бойынша өз біліміңізді пайдаланыңыз.\n"
            "3. Егер нақты экспонат бойынша мәлімет мұражай базасында әлі болмаса, бұл ақпарат жадыға әлі жүктелмегенін қысқаша атап өтіп, "
            "NASA мен ғарыштық зерттеулердің жалпы деректеріне сүйеніп жауап беріңіз.\n"
            "4. Тек қазақ тілінде, сауатты, қысқа әрі нұсқа (2-3 қысқа абзацтан асырмай), ең маңыздысын бөліп көрсетіп жауап беріңіз.\n"
            "5. Эмодзи мен ұзын сызықшаларды қолданбаңыз."
        )

    return (
        "You are AIstronaut, the intelligent space guide and assistant for the interactive 3D museum. "
        "Your mission is to answer visitor questions about NASA equipment, lunar and Martian missions, space exploration, and astronomy.\n"
        "Operating guidelines:\n"
        "1. Knowledge base priority: if context from the museum archives is provided, base your answer primarily on it.\n"
        "2. Internal knowledge: if the retrieved context is insufficient or absent, "
        "use your broad knowledge of astronomy, space exploration, and NASA missions to provide a factual, helpful, and engaging answer.\n"
        "3. If specific information about an artifact is not yet in the museum database, briefly mention that detailed records on this topic are not yet loaded into memory, "
        "and proceed to answer using general NASA and spaceflight knowledge.\n"
        "4. Respond strictly in English in a concise, well-structured tone (no more than 2-3 short paragraphs), focusing on key facts.\n"
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
                "Контекст из базы знаний музея: [Прямых записей по данному вопросу в базе музея пока не найдено].\n\n"
                "Ответьте на вопрос пользователя, опираясь на свои знания о NASA и космосе. "
                "Если вопрос о конкретном аппарате или миссии, кратко укажите, что подробная информация еще не загружена в память музея."
            )
        if language == "kk":
            return (
                f"Пайдаланушы сұрағы: {query}\n\n"
                "Мұражайдың білім базасынан контекст: [Мұражай базасында бұл сұрақ бойынша тікелей жазбалар әзірге табылмады].\n\n"
                "NASA және ғарыш туралы біліміңізге сүйене отырып жауап беріңіз. "
                "Егер сұрақ нақты аппарат туралы болса, толық ақпарат мұражай жадына әлі жүктелмегенін қысқаша ескертіңіз."
            )
        return (
            f"User question: {query}\n\n"
            "Museum knowledge base context: [No direct records found in the museum database yet].\n\n"
            "Answer the visitor's question using your knowledge of NASA and space exploration. "
            "If the question is about a specific equipment or mission, briefly note that detailed records are not yet loaded into museum memory."
        )

    context_parts: List[str] = []
    for idx, (chunk, score) in enumerate(chunks_with_scores, start=1):
        context_parts.append(f"[{idx}] Source: {chunk.document.title}\n{chunk.content}")

    context_block = "\n\n".join(context_parts)

    if language == "ru":
        return (
            f"Контекст из архивов музея:\n{context_block}\n\n"
            f"Вопрос пользователя: {query}\n\n"
            "Дайте ответ на основе приведенного контекста (приоритет). При необходимости дополните ответ проверенными фактами из общих знаний о NASA и космосе."
        )
    if language == "kk":
        return (
            f"Мұражай мұрағатынан мәліметтер:\n{context_block}\n\n"
            f"Пайдаланушы сұрағы: {query}\n\n"
            "Берілген контекстке сүйене отырып (негізгі басымдық) жауап беріңіз. Қажет болса, NASA және ғарыш туралы жалпы деректермен толықтырыңыз."
        )
    return (
        f"Context from museum archives:\n{context_block}\n\n"
        f"User question: {query}\n\n"
        "Provide an answer based primarily on the context above. If needed, supplement with established facts from general NASA and spaceflight knowledge."
    )
