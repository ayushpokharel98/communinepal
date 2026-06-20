import logging
from chat.models import Message, Conversation
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import BasePermission
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
from chat.serializers import MessageSerializer
logger = logging.getLogger(__name__)

def checkMessageMember(conversation, member):
    return member in conversation.members.all()

def checkMessageOwner(message, user):
    if(message.sender!=user):
        raise PermissionDenied("You don't have the permission to do this!")

class MessageService:
    @classmethod
    def _broadcast(cls, conversation_id, event_type, data):
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            logger.warning("Channel layer not configured")
            return
        
        try:
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation_id}", 
                {
                    "type":"chat_event",
                    "event": event_type,
                    "data": data
                }
            )
        except Exception:
            logger.exception("Failed to broadcast the message")
            
    @classmethod
    def send_message(cls, sender, conversation_id, content, parent_id=None):
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            members=sender
        )
        
        msg = Message.objects.create(conversation = conversation, sender = sender, content = content, parent_id = parent_id)
        
        transaction.on_commit(lambda: cls._broadcast(conversation_id, "message", MessageSerializer(msg).data))
        return msg
    
    @classmethod
    def edit_message(cls, user, message_id, content):
        message = get_object_or_404(Message, id=message_id)
        checkMessageOwner(message, user)
        
        message.content = content
        message.is_edited = True
        
        message.save(update_fields=["content", "is_edited"])
        transaction.on_commit(lambda: cls._broadcast(message.conversation.id, "message_edit", MessageSerializer(message).data))
        
        return message
        
    @classmethod
    def delete_message(cls, user, message_id):
        message = get_object_or_404(Message, id=message_id)
        checkMessageOwner(message, user)
        
        message.is_deleted=True
        
        message.save(update_fields=["is_deleted"])
        
        transaction.on_commit(
            lambda: cls._broadcast(message.conversation.id, "message_delete", {"id": message.id})
        )
        
        return message