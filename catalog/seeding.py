"""Load the NASA equipment catalog from data/artifacts.json into the database.

Used by:
- migration 0003 (so a plain `python manage.py migrate` fills an empty database);
- the `seed_catalog` command (to apply later edits of data/artifacts.json).

Model classes are passed in, so the same code works with historical models inside a
migration and with the real models in the command. Loading is idempotent: records are
matched by their codes, and sources missing from the file are removed.
"""

import json
from pathlib import Path

from django.conf import settings

DATA_FILE = Path(settings.BASE_DIR) / "data" / "artifacts.json"

ARTIFACT_DEFAULTS = {
    "orbit_parameters": "",
    "status": "",
    "brief_description": "",
    "first_person_story": "",
    "key_facts": [],
    "fleet_members": [],
    "translations": {},
    "image_url": "",
    "model_3d": "",
    "priority": 1,
}
ARTIFACT_OPTIONAL = ("latitude", "longitude", "launch_date", "landing_date", "end_of_mission_date")


def _records_of(records, model):
    return [entry for entry in records if entry.get("model") == model]


def load_catalog(Body, Artifact, Source, data_file=DATA_FILE):
    """Create or update bodies, artifacts and sources. Returns counts per model."""
    records = json.loads(Path(data_file).read_text(encoding="utf-8"))

    bodies = {}
    for entry in _records_of(records, "catalog.body"):
        f = entry["fields"]
        bodies[entry["pk"]], _ = Body.objects.update_or_create(
            code=f["code"],
            defaults={
                "name": f["name"],
                "radius_scene": f.get("radius_scene", 1.0),
                "texture_file": f.get("texture_file", ""),
                "description": f.get("description", ""),
            },
        )

    artifacts = {}
    for entry in _records_of(records, "catalog.artifact"):
        f = entry["fields"]
        defaults = {"name": f["name"], "artifact_type": f["artifact_type"], "body": bodies[f["body"]]}
        defaults.update({key: f.get(key) for key in ARTIFACT_OPTIONAL})
        defaults.update({key: f.get(key, default) for key, default in ARTIFACT_DEFAULTS.items()})
        artifacts[entry["pk"]], _ = Artifact.objects.update_or_create(code=f["code"], defaults=defaults)

    source_urls = {}
    for entry in _records_of(records, "catalog.source"):
        f = entry["fields"]
        artifact = artifacts[f["artifact"]]
        Source.objects.update_or_create(
            artifact=artifact,
            url=f["url"],
            defaults={"title": f["title"], "details": f.get("details", "")},
        )
        source_urls.setdefault(artifact.pk, set()).add(f["url"])

    # A source removed or re-pointed in the file (e.g. a corrected URL) must not linger in the database.
    for artifact in artifacts.values():
        Source.objects.filter(artifact=artifact).exclude(url__in=source_urls.get(artifact.pk, set())).delete()

    return {"bodies": len(bodies), "artifacts": len(artifacts), "sources": sum(map(len, source_urls.values()))}
