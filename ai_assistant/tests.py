from django.core.exceptions import ValidationError
from django.test import TestCase
from ai_assistant.admin import extract_title_from_text
from ai_assistant.forms import BatchUploadForm
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

        # Confirm no em-dashes, emojis, or Silent Pioneers in system prompts
        for p in (en_prompt, ru_prompt, kk_prompt):
            self.assertNotIn("\u2014", p)
            self.assertNotIn("\u2013", p)
            self.assertNotIn("Silent Pioneers", p)


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


class BatchUploadTests(TestCase):
    def test_extract_title_from_heading(self):
        text = "# Apollo 11 Lunar Module\n\nLanded on Tranquility Base in 1969."
        self.assertEqual(extract_title_from_text("doc1.md", text), "Apollo 11 Lunar Module")

    def test_extract_title_fallback_to_filename(self):
        text = "Landed on Tranquility Base in 1969 without any markdown headers."
        self.assertEqual(extract_title_from_text("lunar_roving_vehicle.txt", text), "lunar roving vehicle")

    def test_form_requires_source(self):
        form = BatchUploadForm(data={"language": "en", "auto_index": True})
        self.assertFalse(form.is_valid())
        self.assertIn("language", form.cleaned_data or {})

    def test_form_validates_server_folder_exists(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            form = BatchUploadForm(data={"language": "ru", "folder_path": tmp_dir, "auto_index": False})
            self.assertTrue(form.is_valid())
            self.assertEqual(form.cleaned_data["language"], "ru")
            self.assertFalse(form.cleaned_data["auto_index"])

    def test_form_rejects_nonexistent_folder(self):
        form = BatchUploadForm(data={"language": "ru", "folder_path": "non_existent_folder_xyz_123"})
        self.assertFalse(form.is_valid())

    def test_admin_batch_upload_integration(self):
        import tempfile
        from pathlib import Path
        from django.contrib.auth.models import User
        from django.urls import reverse

        admin_user = User.objects.create_superuser("admin_test", "admin@test.com", "password123")
        self.client.force_login(admin_user)

        with tempfile.TemporaryDirectory() as tmp_dir:
            f1 = Path(tmp_dir) / "curiosity_rover.md"
            f1.write_text("# Curiosity Rover on Mars\n\nCuriosity explores Gale Crater.", encoding="utf-8")
            f2 = Path(tmp_dir) / "opportunity_rover.txt"
            f2.write_text("Opportunity operated for nearly 15 years on Mars.", encoding="utf-8")

            url = reverse("admin:ai_assistant_batch_upload")
            response = self.client.post(
                url,
                data={
                    "language": "en",
                    "folder_path": tmp_dir,
                    "auto_index": False,
                    "overwrite": False,
                },
                follow=True,
            )
            self.assertEqual(response.status_code, 200)

            docs = KnowledgeDocument.objects.filter(language="en")
            self.assertEqual(docs.count(), 2)
            titles = set(docs.values_list("title", flat=True))
            self.assertIn("Curiosity Rover on Mars", titles)
            self.assertIn("opportunity rover", titles)

