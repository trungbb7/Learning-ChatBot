from django.urls import path
from . import views


urlpatterns = [
    path('create-quiz-api/', views.create_quiz_api, name='create_quiz_api'),
    path('create-quiz/', views.create_quiz, name='create-quiz'),
    
]
