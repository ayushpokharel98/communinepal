from chat.models import Conversation, Message, ConversationUserState
from django.shortcuts import get_object_or_404
from django.db.models import OuterRef, Subquery, Exists, Q


class ConversationSelector:
    @staticmethod
    def get_user_conversations(user):
        user_state = ConversationUserState.objects.filter(
            conversation=OuterRef("pk"), user=user
        )

        conversations = Conversation.objects.filter(members=user).annotate(
            cleared_at=Subquery(user_state.values("cleared_at")[:1])
        )

        visible_messages = Message.objects.filter(
            conversation_id=OuterRef("pk")
        ).filter(created_at__gt=OuterRef("cleared_at"))

        return (
            conversations.annotate(has_visible_messages=Exists(visible_messages))
            .filter(
                Q(cleared_at__isnull=True) | Q(has_visible_messages=True)
            )
            .prefetch_related("members")
            .order_by("-updated_at")
        )
