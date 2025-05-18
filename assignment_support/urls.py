from django.urls import path
from . import views


urlpatterns = [
    path("assignment_support", views.assignment_support, name="assignment_support"),
    path("suggest", views.suggest, name="suggest"),
    # path("handle_text", views.handle_text, name="handle_text"),
    path("handle_exercise", views.handle_exercise, name="handle_exercise")
    # path("handle_exercise_image", views.handle_exercise_image, name="handle_exercise_image")
    
]
