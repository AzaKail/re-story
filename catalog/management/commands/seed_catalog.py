import json
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from catalog.models import Artifact, Body, Source


class Command(BaseCommand):
    help = "Seed database with NASA museum artifacts, fleet data, and sources from data/artifacts.json"

    def handle(self, *args, **options):
        data_path = Path(settings.BASE_DIR) / "data" / "artifacts.json"

        if not data_path.exists():
            self.stderr.write(self.style.ERROR(f"Data file not found at: {data_path}"))
            return

        with open(data_path, "r", encoding="utf-8") as f:
            records = json.load(f)

        bodies_count = 0
        artifacts_count = 0
        sources_count = 0
        body_id_map = {}
        artifact_id_map = {}

        # Pass 1: Bodies
        for entry in records:
            if entry.get("model") == "catalog.body":
                fields = entry["fields"]
                body, _ = Body.objects.update_or_create(
                    code=fields["code"],
                    defaults={
                        "name": fields["name"],
                        "radius_scene": fields.get("radius_scene", 1.0),
                        "texture_file": fields.get("texture_file", ""),
                        "description": fields.get("description", ""),
                    },
                )
                body_id_map[entry.get("pk")] = body
                bodies_count += 1

        # Pass 2: Artifacts
        for entry in records:
            if entry.get("model") == "catalog.artifact":
                fields = entry["fields"]
                body_pk = fields["body"]
                body = body_id_map.get(body_pk) or Body.objects.get(pk=body_pk)

                artifact, _ = Artifact.objects.update_or_create(
                    code=fields["code"],
                    defaults={
                        "name": fields["name"],
                        "artifact_type": fields["artifact_type"],
                        "body": body,
                        "latitude": fields.get("latitude"),
                        "longitude": fields.get("longitude"),
                        "orbit_parameters": fields.get("orbit_parameters", ""),
                        "launch_date": fields.get("launch_date"),
                        "landing_date": fields.get("landing_date"),
                        "end_of_mission_date": fields.get("end_of_mission_date"),
                        "status": fields.get("status", ""),
                        "brief_description": fields.get("brief_description", ""),
                        "first_person_story": fields.get("first_person_story", ""),
                        "key_facts": fields.get("key_facts", []),
                        "fleet_members": fields.get("fleet_members", []),
                        "image_url": fields.get("image_url", ""),
                        "model_3d": fields.get("model_3d", ""),
                        "priority": fields.get("priority", 1),
                    },
                )
                artifact_id_map[entry.get("pk")] = artifact
                artifacts_count += 1

        # Pass 3: Sources
        for entry in records:
            if entry.get("model") == "catalog.source":
                fields = entry["fields"]
                artifact_pk = fields["artifact"]
                artifact = artifact_id_map.get(artifact_pk) or Artifact.objects.get(pk=artifact_pk)

                Source.objects.update_or_create(
                    artifact=artifact,
                    url=fields["url"],
                    defaults={
                        "title": fields["title"],
                        "details": fields.get("details", ""),
                    },
                )
                sources_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully loaded {bodies_count} bodies, {artifacts_count} artifacts, and {sources_count} sources."
            )
        )
