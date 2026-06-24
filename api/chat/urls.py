from django.urls import path
from .views import (
    ConversationView,
    ConversationMessageView,
    MessageSendView,
    MessageUpdateView,
    ConversationCallsView,
    ConversationTimelineView
)

urlpatterns = [
    path("conversation/", ConversationView.as_view(), name="conversations"),
    path(
        "messages/<uuid:conversation_id>/",
        ConversationMessageView.as_view(),
        name="messages",
    ),
    path(
        "calls/<uuid:conversation_id>/",
        ConversationCallsView.as_view(),
        name="messages",
    ),
    path(
        "timeline/<uuid:conversation_id>/",
        ConversationTimelineView.as_view(),
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
