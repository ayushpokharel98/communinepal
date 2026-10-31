import logging
from chat.models import Conversation, MessageMedia, ConversationUserState
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.serializers import (
    ConversationSerializer,
    UserBasicSerializer,
    MessageSerializer,
)
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


class ConversationService:
    @staticmethod
    def _broadcast(user_id, conversation_id, event_type, request=None, last_messsage=None):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured")

        try:
            if event_type == "new":
                self = request.user
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{user_id}",
                    {
                        "type": "send_conversation_data",
                        "event": event_type,
                        "data": {
                            "id": str(conversation_id),
                            "other_user": UserBasicSerializer(self).data,
                        },
                    },
                )
            else:
                async_to_sync(channel_layer.group_send)(
                    f"conversation_{user_id}",
                    {
                        "type": "send_conversation_data",
                        "event": event_type,
                        "data": {
                            "id": str(conversation_id),
                            "last_message": last_messsage
                        },
                    },
                )
        except Exception:
            logger.exception("Failed to broadcast message!")

    @staticmethod
    def get_or_create_conversation(user1, user2):
        conversation = Conversation.objects.filter(members=user1).filter(members=user2).first()
        if conversation:
            return conversation, False
        
        conversation = Conversation.objects.create()
        conversation.members.add(user1,user2)
    
        return conversation, True

    @staticmethod
    def delete_conversation(user, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(members=user),
            id=conversation_id,
        )

        state, _ = ConversationUserState.objects.get_or_create(
            conversation=conversation, user=user
        )
        
        state.cleared_at = timezone.now()
        state.save(update_fields=["cleared_at"])
        
        return conversation
