from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.pagination import CursorPagination
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

class MessagePagination(CursorPagination):
    page_size = 30
    ordering = "-created_at"
    cursor_query_param = "cursor"

class ConversationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        conversations = ConversationSelector.get_user_conversations(user = request.user)
        s = ConversationSerializer(conversations, many=True, context = {"request": request})
        
        return Response(s.data, status=HTTP_200_OK)
    
    def post(self, request):
        s = ConversationCreateSerializer(data = request.data)
        s.is_valid(raise_exception=True)
        username = s.validated_data["username"]
        user = get_object_or_404(User, username=username)
        conversation = ConversationService.get_or_create_conversation(user1=request.user, user2=user)
        ConversationService._broadcast(user.id, conversation.id, "new", request)
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=HTTP_201_CREATED
        )

class ConversationMessageView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    pagination_class = MessagePagination

    def get_queryset(self):
        return MessageSelector.get_conversation_messages(
            self.request.user,
            self.kwargs["conversation_id"]
        )

class MessageSendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        content = request.data.get("content")
        parent_id = request.data.get("parent_id")
        if not content:
            return Response({"detail":"Content is required!"}, status=HTTP_400_BAD_REQUEST)
        
        message = MessageService.send_message(request.user, conversation_id, content, parent_id)
        s = MessageSerializer(message, context = {"request": request})
        
        return Response(s.data, HTTP_201_CREATED)
    
class MessageUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, message_id):
        s = MessageUpdateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        
        message = MessageService.edit_message(request.user, message_id, s.validated_data["content"])
        
        return Response(MessageSerializer(message, context = {"request": request}).data, status=HTTP_200_OK)
    
    def delete(self, request, message_id):
        MessageService.delete_message(request.user, message_id)
        return Response({"detail": "Message Deleted Successfully!"},status=HTTP_200_OK)
    