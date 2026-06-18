from rest_framework.views import APIView
from .serializers import (
    MessageSerializer,
    ConversationSerializer,
    ConversationCreateSerializer,
    MessageUpdateSerializer
)
from .models import (
    Message,
    Conversation,
    MessageSeen
)
from messages.selectors import ConversationSelector, MessageSelector
from rest_framework.status import HTTP_200_OK
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth  import get_user_model
from rest_framework.response import Response

User = get_user_model()

class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        messages = MessageSelector.get_conversation_messages(request.user, conversation_id)
        
        return Response(MessageSerializer(messages).data, status=HTTP_200_OK)
    
    def post(self, request, conversation_id):
        