from chat.models import TimelineEvent, Message, Call


class MessageSelector:
    @staticmethod
    def get_conversation_timeline(user, conversation_id):
        return TimelineEvent.objects.filter(
            conversation_id=conversation_id, conversation__members=user
        ).select_related(
            "message",
            "message__sender",
            "message__sender__profile",
            "call",
            "call__initiator",
            "call__initiator__profile",
            "call__receiver",
            "call__receiver__profile",
        )
    
    def get_conversation_messages(user, conversation_id):
        return Message.objects.filter(
            conversation_id=conversation_id, conversation__members=user
        ).select_related(
            "sender",
            "sender__profile"
        ).order_by("created_at")
    
    def get_conversation_calls(user,conversation_id):
        return Call.objects.filter(
            conversation_id=conversation_id, conversation__members=user
        ).select_related(
            "initiator",
            "initiator__profile",
            "receiver",
            "receiver__profile",
        ).order_by("created_at")
