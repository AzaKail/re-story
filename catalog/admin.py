from django.contrib import admin
from catalog.models import Artifact, Body, Source


class SourceInline(admin.TabularInline):
    model = Source
    extra = 1


@admin.register(Body)
class BodyAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "radius_scene")
    search_fields = ("name", "code")


@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "body", "artifact_type", "status", "priority")
    list_filter = ("body", "artifact_type")
    search_fields = ("name", "code", "brief_description")
    inlines = [SourceInline]


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("title", "artifact", "url")
    search_fields = ("title", "url", "artifact__name")
