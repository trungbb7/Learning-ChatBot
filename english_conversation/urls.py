from django.urls import path
from . import views


urlpatterns = [
    path(
        "english-conversation", views.english_conversation, name="english-conversation"
    ),
    path(
        "api/english-conversation/start",
        views.start_conversation,
        name="english-conversation-start",
    ),
    path(
        "api/english-conversation/continue",
        views.continue_conversation,
        name="english-conversation-continue",
    ),
    path(
        "api/conversation-history",
        views.get_conversation_history,
        name="conversation-history",
    ),
    path(
        "api/get-conversation/<int:id>", views.get_conversation, name="get-conversation"
    ),
    path(
        "api/english-conversation/delete",
        views.remove_conversation,
        name="delete-conversation",
    ),
    path(
        "api/english-conversation/delete-all",
        views.remove_all_conversation,
        name="delete-all-conversation",
    ),
]
