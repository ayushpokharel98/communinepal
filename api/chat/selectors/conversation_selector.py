from chat.models import Conversation
from django.shortcuts import get_object_or_404

class ConversationSelector:
    @staticmethod
    def get_user_conversations(user):
        return Conversation.objects.filter(members=user).prefetch_related("members").order_by("-updated_at")