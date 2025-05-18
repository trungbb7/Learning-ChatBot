from django.urls import path
from . import views


urlpatterns = [
    path('summarize', views.index, name='summarize'),
    path('api/summarize', views.summarize_api)
]


