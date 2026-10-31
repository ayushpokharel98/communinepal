from chat.models import Message, Conversation, ConversationUserState
from django.shortcuts import get_object_or_404


class MessageSelector:
    @staticmethod
    def get_conversation_messages(user, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.filter(members=user), id=conversation_id
        )

        state = ConversationUserState.objects.filter(
            conversation=conversation, user=user
        ).first()

        messages = Message.objects.filter(
            conversation=conversation,
        )

        if state and state.cleared_at:
            messages = messages.filter(created_at__gt=state.cleared_at)

        return (
            messages.select_related("sender", "sender__profile")
            .prefetch_related("media")
            .order_by("-created_at")
        )
