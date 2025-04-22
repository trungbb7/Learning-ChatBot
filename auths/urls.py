from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
    path("accounts/login", auth_views.LoginView.as_view(template_name="registration/login.html"), name="login"),
    path('accounts/logout', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    path("accounts/register", views.register, name='register'),
    path('accounts/', include('django.contrib.auth.urls')),
]
