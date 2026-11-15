from django.db import migrations


def load(apps, schema_editor):
    """Reload data/artifacts.json: the catalog grew from 15 to 28 objects."""
    from catalog.seeding import load_catalog

    load_catalog(
        apps.get_model("catalog", "Body"),
        apps.get_model("catalog", "Artifact"),
        apps.get_model("catalog", "Source"),
    )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0006_artifact_model"),
    ]

    operations = [
        migrations.RunPython(load, migrations.RunPython.noop),
    ]
