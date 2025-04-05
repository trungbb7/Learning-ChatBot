from django.urls import path
from . import views

urlpatterns = [
    path("summarize", views.summarizeHome),
    path("api/summarize", views.summarize),
]
