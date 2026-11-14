from django.core.management.base import BaseCommand, CommandError

from catalog.models import Artifact, Body, Source
from catalog.seeding import DATA_FILE, load_catalog


class Command(BaseCommand):
    help = (
        "Load NASA museum artifacts, fleet data and sources from data/artifacts.json. "
        "migrate already does this once; run it again after editing the file."
    )

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            raise CommandError(f"Data file not found at: {DATA_FILE}")
        counts = load_catalog(Body, Artifact, Source)
        self.stdout.write(self.style.SUCCESS(
            "Successfully loaded {bodies} bodies, {artifacts} artifacts, and {sources} sources.".format(**counts)
        ))
