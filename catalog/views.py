from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from catalog.models import Artifact, Body


def index(request):
    return render(request, "index.html")


def api_bodies(request):
    bodies = Body.objects.all().order_by("id")
    data = [
        {
            "id": b.id,
            "name": b.name,
            "code": b.code,
            "radius_scene": b.radius_scene,
            "texture_file": b.texture_file,
            "description": b.description,
        }
        for b in bodies
    ]
    return JsonResponse({"bodies": data})


def api_artifacts(request):
    body_filter = request.GET.get("body", "").strip().lower()
    lang = request.GET.get("lang", "").strip().lower()
    artifacts = Artifact.objects.select_related("body").all()

    if body_filter:
        artifacts = artifacts.filter(body__code=body_filter)

    data = []
    for a in artifacts:
        trans = a.translations.get(lang, {}) if lang in ("ru", "kk") else {}
        data.append({
            "id": a.id,
            "name": trans.get("name", a.name),
            "code": a.code,
            "artifact_type": a.artifact_type,
            "body": a.body.code,
            "body_name": a.body.name,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "orbit_parameters": a.orbit_parameters,
            "launch_date": a.launch_date.isoformat() if a.launch_date else None,
            "landing_date": a.landing_date.isoformat() if a.landing_date else None,
            "end_of_mission_date": a.end_of_mission_date.isoformat() if a.end_of_mission_date else None,
            "status": trans.get("status", a.status),
            "brief_description": trans.get("brief_description", a.brief_description),
            "key_facts": trans.get("key_facts", a.key_facts),
            "fleet_members": trans.get("fleet_members", a.fleet_members),
            "translations": a.translations,
            "image_url": a.image_url,
            "model_3d": a.model_3d,
            "model": a.model,
            "priority": a.priority,
        })
    return JsonResponse({"artifacts": data})


def api_artifact_detail(request, code):
    artifact = get_object_or_404(Artifact.objects.select_related("body").prefetch_related("sources"), code=code)
    lang = request.GET.get("lang", "").strip().lower()
    trans = artifact.translations.get(lang, {}) if lang in ("ru", "kk") else {}

    sources = [
        {
            "id": s.id,
            "title": s.title,
            "url": s.url,
            "details": s.details,
        }
        for s in artifact.sources.all()
    ]

    data = {
        "id": artifact.id,
        "name": trans.get("name", artifact.name),
        "code": artifact.code,
        "artifact_type": artifact.artifact_type,
        "body": artifact.body.code,
        "body_name": artifact.body.name,
        "latitude": artifact.latitude,
        "longitude": artifact.longitude,
        "orbit_parameters": artifact.orbit_parameters,
        "launch_date": artifact.launch_date.isoformat() if artifact.launch_date else None,
        "landing_date": artifact.landing_date.isoformat() if artifact.landing_date else None,
        "end_of_mission_date": artifact.end_of_mission_date.isoformat() if artifact.end_of_mission_date else None,
        "status": trans.get("status", artifact.status),
        "brief_description": trans.get("brief_description", artifact.brief_description),
        "first_person_story": trans.get("first_person_story", artifact.first_person_story),
        "key_facts": trans.get("key_facts", artifact.key_facts),
        "fleet_members": trans.get("fleet_members", artifact.fleet_members),
        "translations": artifact.translations,
        "image_url": artifact.image_url,
        "now_view": artifact.now_view,
        "model_3d": artifact.model_3d,
        "model": artifact.model,
        "priority": artifact.priority,
        "sources": sources,
    }
    return JsonResponse(data)
