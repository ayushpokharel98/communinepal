import logging
from chat.models import Conversation
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.serializers import ConversationSerializer, UserBasicSerializer, TimelineEventSerializer
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)
class ConversationService:
    @staticmethod
    def _broadcast(user_id, conversation_id, event_type, request=None):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured")
        
        try:
            if(event_type == "new"):      
                self = request.user
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{user_id}",
                    {
                        "type": "send_conversation_data",
                        "event": event_type,
                        "data": {
                            "id": str(conversation_id),
                            "other_user": UserBasicSerializer(self).data
                        }
                    }
                )
            else:
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{user_id}",
                    {
                        "type": "send_conversation_data",
                        "event": event_type, 
                        "data":{
                            "id": str(conversation_id),
                            "last_event": TimelineEventSerializer(conversation.last_event).data,
                        }
                    }
                )
        except Exception:
            logger.exception("Failed to broadcast message!")         
        
    @staticmethod
    def get_or_create_conversation(user1, user2):
        conversations = Conversation.objects.filter(members=user1).filter(members=user2)
        
        if conversations.exists():
            return conversations.first()
        
        conversation = Conversation.objects.create()
        
        conversation.members.add(user1, user2)
        
        return conversation
    
    