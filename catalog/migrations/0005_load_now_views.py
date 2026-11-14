"""Re-load data/artifacts.json so the new now_view field is filled on existing databases too."""

from django.db import migrations


def load(apps, schema_editor):
    from catalog.seeding import load_catalog

    load_catalog(
        apps.get_model("catalog", "Body"),
        apps.get_model("catalog", "Artifact"),
        apps.get_model("catalog", "Source"),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0004_artifact_now_view"),
    ]

    operations = [
        migrations.RunPython(load, migrations.RunPython.noop),
    ]
