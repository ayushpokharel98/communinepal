from chat.models import Conversation
from django.shortcuts import get_object_or_404
class MessageSelector:
    @staticmethod
    def get_conversation_messages(user, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, members=user)
        
        return conversation.messages.select_related("sender")
    