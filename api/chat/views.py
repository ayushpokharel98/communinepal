from rest_framework.views import APIView
from rest_framework import generics
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
from chat.services.message_service import MessageService
from chat.services.conversation_service import ConversationService
from chat.selectors.message_selector import MessageSelector
from chat.selectors.conversation_selector import ConversationSelector
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_204_NO_CONTENT
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth  import get_user_model
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

User = get_user_model()

class ConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversations = ConversationSelector.get_user_conversations(user = request.user)
        s = ConversationSerializer(conversations, many=True)
        
        return Response(s.data, status=HTTP_200_OK)
    
    def post(self, request):
        s = ConversationCreateSerializer(data = request.data)
        s.is_valid(raise_exception=True)
        username = s.validated_data["username"]
        user = get_object_or_404(User, username=username)
        conversation = ConversationService.get_or_create_conversation(user1=request.user, user2=user)
        
        return Response(
            ConversationSerializer(conversation).data,
            status=HTTP_201_CREATED
        )

class ConversationMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        messages = MessageSelector.get_conversation_messages(request.user, conversation_id)
        
        serializer = MessageSerializer(messages, many=True)
        
        return Response(serializer.data)
    
class MessageSendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id, parent_id=None):
        content = request.data.get("content")
        if not content:
            return Response({"detail":"Content is required!"}, status=HTTP_400_BAD_REQUEST)
        
        message = MessageService.send_message(request.user, conversation_id, content, parent_id)
        s = MessageSerializer(message)
        
        return Response(s.data, HTTP_201_CREATED)
    
class MessageUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, message_id):
        s = MessageUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        
        message = MessageService.edit_message(request.user, message_id, s.validated_data["content"])
        
        return Response(MessageSerializer(message).data, status=HTTP_200_OK)
    
    def delete(self, request, message_id):
        MessageService.delete_message(request.user, message_id)
        return Response({"detail": "Message Deleted Successfully!"},status=HTTP_204_NO_CONTENT)
    