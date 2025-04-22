from django.urls import path
from . import views


urlpatterns = [
    path("english-conversation", views.english_conversation, name="english-conversation")
]
