import logging
from chat.models import Conversation, MessageMedia
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.serializers import (
    ConversationSerializer,
    UserBasicSerializer,
    MessageSerializer,
)
from django.shortcuts import get_object_or_404
from django.db import transaction

logger = logging.getLogger(__name__)


class ConversationService:
    @staticmethod
    def _broadcast(user_id, conversation_id, event_type, request=None):
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
                            "last_message": MessageSerializer(
                                conversation.last_message
                            ).data,
                        },
                    },
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


    @staticmethod
    @transaction.atomic
    def delete_conversation(user, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(members=user),
            id=conversation_id,
        )

        members_ids = list(
            conversation.members.values_list("id", flat=True)
        )

        media_files = [
            (media.file.storage, media.file.name)
            for media in MessageMedia.objects.filter(
                message__conversation=conversation
            ).exclude(file="")
        ]

        conversation_id = str(conversation.id)
        conversation.delete()

        def after_commit():
            for storage, file_name in media_files:
                try:
                    storage.delete(file_name)
                except Exception:
                    logger.exception(
                        "Failed to delete conversation media: %s",
                        file_name,
                    )
            channel_layer = get_channel_layer()
            if not channel_layer:
                return

            for member_id in members_ids:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"conversation_{member_id}",
                        {
                            "type": "send_conversation_data",
                            "event": "delete",
                            "data": {"id": conversation_id},
                        },
                    )
                except Exception:
                    logger.exception(
                        "Failed to broadcast conversation deletion"
                    )

        transaction.on_commit(after_commit)
