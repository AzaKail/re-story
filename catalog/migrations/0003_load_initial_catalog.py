"""Fill the catalog from data/artifacts.json, so `python manage.py migrate` alone gives a working site."""

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
        ("catalog", "0002_artifact_translations"),
    ]

    operations = [
        migrations.RunPython(load, migrations.RunPython.noop),
    ]
