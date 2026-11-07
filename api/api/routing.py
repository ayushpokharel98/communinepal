from chat.routing import websocket_urlpatterns as message_patterns
from notifications.routing import websocket_urlpatterns as notification_patterns
from calls.routing import websocket_urlpatterns as call_patterns

websocket_urlpatterns = (
    message_patterns +
    notification_patterns +
    call_patterns
)