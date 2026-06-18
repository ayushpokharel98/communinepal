from messages.models import Message, Conversation
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import BasePermission
from django.shortcuts import get_object_or_404

def checkMessageMember(conversation, member):
    return member in conversation.members.all()

def checkMessageOwner(message, user):
    if(message.sender!=user):
        raise PermissionDenied("You don't have the permission to do this!")

class MessageService:
    @staticmethod
    def send_message(sender, conversation_id, **validated_data):
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            members=sender
        )
        
        msg = Message.objects.create(conversation = conversation, sender = sender, content = validated_data.get("content"), parent_id = validated_data.get("parent_id"))
        
        return msg
    
    @staticmethod
    def edit_message(user, message_id, content):
        message = get_object_or_404(Message, id=message_id)
        checkMessageOwner(message, user)
        
        message.content = content
        message.is_edited = True
        
        message.save(update_fields=["content", "is_edited"])
    
    @staticmethod
    def delete_message(user, message_id):
        message = get_object_or_404(Message, id=message_id)
        checkMessageOwner(message, user)
        
        message.is_deleted=True
        
        message.save(update_fields=["is_deleted"])
        