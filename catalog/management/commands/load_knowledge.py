"""Load the museum knowledge base for the AIstronaut chat from data/knowledge/<lang>/*.txt.

Usage:
    python manage.py load_knowledge            # add new files, update changed ones
    python manage.py load_knowledge --reindex  # rebuild every document's chunks

Each file becomes one KnowledgeDocument with the language of its folder (en, ru, kk).
Documents are matched by (title, language), so running the command again never creates duplicates.
"""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ai_assistant.admin import index_knowledge_document
from ai_assistant.models import KnowledgeDocument

KNOWLEDGE_DIR = Path(settings.BASE_DIR) / "data" / "knowledge"
LANGUAGES = ("en", "ru", "kk")

# File slug -> document title shown in the admin (the language is shown next to it).
TITLES = {
    "equipment-catalog": "NASA Equipment Catalog (generated from data/artifacts.json)",
    "apollo-11": "Apollo 11 Lunar Module / EASEP",
    "apollo-12": "Apollo 12 Lunar Module / ALSEP",
    "apollo-15": "Apollo 15 Lunar Module / ALSEP",
    "kepler": "Kepler / K2",
    "mars-pathfinder": "Mars Pathfinder",
    "near-shoemaker": "NEAR Shoemaker",
    "pioneer-10": "Pioneer 10",
    "solar-system": "Encyclopedia of the Solar System",
    "spirit-opportunity": "Mars Exploration Rovers Spirit and Opportunity",
    "surveyor-3": "Surveyor 3",
    "viking-1": "Viking 1",
}


class Command(BaseCommand):
    help = "Load data/knowledge/<lang>/*.txt into the AIstronaut knowledge base and index it."

    def add_arguments(self, parser):
        parser.add_argument("--reindex", action="store_true", help="Re-index every document, even unchanged ones.")

    def handle(self, *args, **options):
        if not KNOWLEDGE_DIR.is_dir():
            raise CommandError(f"Folder not found: {KNOWLEDGE_DIR}")

        stats = {"created": 0, "updated": 0, "unchanged": 0, "failed": 0}
        for lang in LANGUAGES:
            for path in sorted((KNOWLEDGE_DIR / lang).glob("*.txt")):
                stats[self._load_file(path, lang, options["reindex"])] += 1

        self.stdout.write(self.style.SUCCESS(
            "Done: {created} created, {updated} updated, {unchanged} unchanged, {failed} failed.".format(**stats)
        ))

    def _load_file(self, path, lang, force_reindex):
        title = TITLES.get(path.stem, path.stem.replace("-", " ").title())
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            self.stderr.write(f"  skip empty file {path.relative_to(KNOWLEDGE_DIR)}")
            return "failed"

        doc, created = KnowledgeDocument.objects.get_or_create(
            title=title, language=lang, defaults={"content": content},
        )
        changed = not created and doc.content != content
        if changed:
            doc.content = content
            doc.save(update_fields=["content", "updated_at"])

        needs_index = created or changed or force_reindex or doc.status != "indexed"
        if not needs_index:
            return "unchanged"

        try:
            chunks = index_knowledge_document(doc)
        except Exception as exc:  # embedding service down, bad text, etc.
            self.stderr.write(self.style.ERROR(f"  [{lang}] {title}: indexing failed: {exc}"))
            return "failed"

        self.stdout.write(f"  [{lang}] {title}: {chunks} chunks")
        return "created" if created else "updated"
