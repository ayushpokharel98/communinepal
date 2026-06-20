from chat.models import Conversation
class ConversationService:
    @staticmethod
    def get_or_create_conversation(user1, user2):
        conversations = Conversation.objects.filter(members=user1).filter(members=user2)
        
        if conversations.exists():
            return conversations.first()
        
        conversation = Conversation.objects.create()
        
        conversation.members.add(user1, user2)
        
        return conversation