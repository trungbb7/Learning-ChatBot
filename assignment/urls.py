from django.urls import path
from . import views


urlpatterns = [
    path("create-quiz", views.create_quiz, name="create-quiz"),
]
