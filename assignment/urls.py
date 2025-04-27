from django.urls import path
from . import views


urlpatterns = [
    path("create-quiz", views.create_quiz, name="create-quiz"),
    path("api/create-quiz", views.create_quiz_api, name="create-quiz-api"),
    path('api/process-pdf', views.process_pdf, name='process_pdf'),
    path('api/process-docx', views.process_docx, name='process_docx')
    
]
