from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
    path("accounts/login", auth_views.LoginView.as_view(template_name="registration/login.html")),
    path("accounts/register", views.register, name='register'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('login_demo', views.login_demo, name='login-demo')
]
