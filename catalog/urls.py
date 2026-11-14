from django.urls import path
from catalog import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/bodies/", views.api_bodies, name="api_bodies"),
    path("api/artifacts/", views.api_artifacts, name="api_artifacts"),
    path("api/artifacts/<slug:code>/", views.api_artifact_detail, name="api_artifact_detail"),
]
