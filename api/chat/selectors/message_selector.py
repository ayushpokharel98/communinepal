from chat.models import Message
class MessageSelector:
    @staticmethod
    def get_conversation_messages(user, conversation_id):
        return (
            Message.objects.filter(
                conversation_id=conversation_id, conversation__members=user
            )
            .select_related("sender", "sender__profile")
            .order_by("-created_at")
        )
