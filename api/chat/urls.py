from django.urls import path
from .views import (
    ConversationView,
    ConversationMessageView,
    MessageSendView,
    MessageUpdateView,
)

urlpatterns = [
    path("conversation/", ConversationView.as_view(), name="conversations"),
    path(
        "messages/<uuid:conversation_id>/",
        ConversationMessageView.as_view(),
        name="messages",
    ),
    path(
        "message/<uuid:conversation_id>/",
        MessageSendView.as_view(),
        name="message-send",
    ),
    path(
        "message/<uuid:message_id>/update/",
        MessageUpdateView.as_view(),
        name="update-message",
    ),
]
