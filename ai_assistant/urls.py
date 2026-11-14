from django.urls import path
from . import views

app_name = "ai_assistant"

urlpatterns = [
    path("chat/", views.ChatView.as_view(), name="chat"),
    path("health/", views.HealthView.as_view(), name="health"),
]
