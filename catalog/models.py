from django.db import models


class Body(models.Model):
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=50, unique=True)
    radius_scene = models.FloatField(default=1.0)
    texture_file = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Bodies"

    def __str__(self):
        return self.name


class Artifact(models.Model):
    TYPE_CHOICES = [
        ("lander", "Lander"),
        ("rover", "Rover"),
        ("helicopter", "Helicopter"),
        ("scientific_package", "Scientific Package"),
        ("orbiter", "Orbiter"),
        ("probe", "Interstellar Probe"),
        ("space_telescope", "Space Telescope"),
    ]

    name = models.CharField(max_length=150)
    code = models.SlugField(max_length=100, unique=True)
    artifact_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    body = models.ForeignKey(Body, on_delete=models.CASCADE, related_name="artifacts")

    # 3D surface coordinates (null for orbital or deep space craft)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    orbit_parameters = models.CharField(max_length=255, blank=True)

    # Mission timeline
    launch_date = models.DateField(null=True, blank=True)
    landing_date = models.DateField(null=True, blank=True)
    end_of_mission_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=255)
    brief_description = models.TextField()
    first_person_story = models.TextField()
    key_facts = models.JSONField(default=list)
    fleet_members = models.JSONField(default=list, blank=True)
    translations = models.JSONField(default=dict, blank=True)
    # Present-day view of the site (orbital or rover photo): image_url, page_url, date, instrument, caption{en,ru,kk}
    now_view = models.JSONField(default=dict, blank=True)
    # NASA 3D model shown when the camera is at the object: url, credit, page_url, optional keep_below (0..1)
    model = models.JSONField(default=dict, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    model_3d = models.CharField(max_length=255, blank=True)
    priority = models.IntegerField(default=1)

    class Meta:
        ordering = ["priority", "name"]

    def __str__(self):
        return f"{self.name} ({self.body.name})"


class Source(models.Model):
    artifact = models.ForeignKey(Artifact, on_delete=models.CASCADE, related_name="sources")
    title = models.CharField(max_length=255)
    url = models.URLField(max_length=500)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} - {self.artifact.name}"
