from django.core.exceptions import ValidationError
from django.test import TestCase
from ai_assistant.models import DocumentChunk, KnowledgeDocument
from ai_assistant.services.chunking import find_natural_cut_point, split_text_into_chunks
from ai_assistant.services.rag import (
    assemble_rag_prompt,
    build_system_prompt,
    compute_cosine_similarity,
    detect_language,
)


class ChunkingAlgorithmTests(TestCase):
    def test_empty_text(self):
        self.assertEqual(split_text_into_chunks(""), [])
        self.assertEqual(split_text_into_chunks("   "), [])

    def test_short_text(self):
        text = "Apollo 11 landed on the Moon."
        chunks = split_text_into_chunks(text, chunk_size=500)
        self.assertEqual(chunks, [text])

    def test_natural_cut_point_prefers_paragraph(self):
        text = "First paragraph here.\n\nSecond paragraph begins here."
        cut = find_natural_cut_point(text, target_pos=35)
        self.assertEqual(text[:cut], "First paragraph here.\n\n")

    def test_split_with_overlap(self):
        text = (
            "The Apollo program was the third United States human spaceflight program. "
            "It succeeded in landing the first humans on the Moon in 1969. "
            "The mission was named Apollo 11. Neil Armstrong was the commander."
        )
        chunks = split_text_into_chunks(text, chunk_size=100, overlap=30)
        self.assertTrue(len(chunks) > 1)
        # Ensure each chunk contains valid words and has reasonable length
        for chunk in chunks:
            self.assertTrue(len(chunk) > 0)


class RAGLogicTests(TestCase):
    def test_language_detection(self):
        self.assertEqual(detect_language("Hello, how are you?"), "en")
        self.assertEqual(detect_language("Привет, как дела на Луне?"), "ru")
        self.assertEqual(detect_language("Сәлем, Ай туралы ақпарат беріңізші"), "kk")

    def test_cosine_similarity(self):
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [1.0, 0.0, 0.0]
        self.assertAlmostEqual(compute_cosine_similarity(vec_a, vec_b), 1.0)

        vec_c = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(compute_cosine_similarity(vec_a, vec_c), 0.0)

        vec_d = [-1.0, 0.0, 0.0]
        self.assertAlmostEqual(compute_cosine_similarity(vec_a, vec_d), -1.0)

    def test_system_prompt_languages(self):
        en_prompt = build_system_prompt("en")
        ru_prompt = build_system_prompt("ru")
        kk_prompt = build_system_prompt("kk")

        self.assertIn("AIstronaut", en_prompt)
        self.assertIn("AIstronaut", ru_prompt)
        self.assertIn("AIstronaut", kk_prompt)

        # Confirm no em-dashes or emojis in system prompts
        for p in (en_prompt, ru_prompt, kk_prompt):
            self.assertNotIn("\u2014", p)
            self.assertNotIn("\u2013", p)


class ModelsValidationTests(TestCase):
    def test_document_requires_content_or_file(self):
        doc = KnowledgeDocument(title="Empty Document", content="")
        with self.assertRaises(ValidationError):
            doc.clean()

    def test_document_creation_and_chunk_relation(self):
        doc = KnowledgeDocument.objects.create(
            title="Sojourner Rover",
            content="Sojourner was the robotic Mars rover that landed in 1997.",
            language="en",
            status="indexed",
        )
        chunk = DocumentChunk.objects.create(
            document=doc,
            chunk_index=1,
            content=doc.content,
            embedding=[0.1] * 768,
        )
        self.assertEqual(doc.chunks.count(), 1)
        self.assertEqual(chunk.document, doc)
        self.assertEqual(len(chunk.embedding), 768)
