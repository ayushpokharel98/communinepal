from django.urls import re_path
from .consumers import ChatConsumer, ConversationConsumer

websocket_urlpatterns = [
    re_path(
        r"ws/chat/(?P<conversation_id>[0-9a-ff]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/$",
        ChatConsumer.as_asgi(),
    ),
    re_path(
        r"ws/chat/conversation/",
        ConversationConsumer.as_asgi(),
    )
]
