from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="home"),
    path("chatbot", views.index, name="chatbot"),
    path("chat", views.chat, name="chat"),
    path("demo", views.demo, name="demo")
]
