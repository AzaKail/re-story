from django.db import migrations, models


def load(apps, schema_editor):
    """Fill the photo authors, corrected photos and the new 3D models from data/artifacts.json."""
    from catalog.seeding import load_catalog

    load_catalog(
        apps.get_model("catalog", "Body"),
        apps.get_model("catalog", "Artifact"),
        apps.get_model("catalog", "Source"),
    )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0007_load_more_catalog"),
    ]

    operations = [
        migrations.AddField(
            model_name="artifact",
            name="image_credit",
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.RunPython(load, migrations.RunPython.noop),
    ]
