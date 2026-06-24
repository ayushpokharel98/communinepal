from django.shortcuts import get_object_or_404
from django.utils import timezone
from chat.models import Call, Conversation
from django.contrib.auth import get_user_model

User = get_user_model()


class CallService:

    @classmethod
    def is_busy(cls, user):
        return (
            Call.objects.filter(status__in=["ringing", "outgoing"])
            .filter(initiator=user)
            .exists()
            or Call.objects.filter(status__in=["ringing", "outgoing"])
            .filter(receiver=user)
            .exists()
        )

    @classmethod
    def create_call(cls, initiator, receiver_id, conversation_id, call_type):
        receiver = get_object_or_404(User, id=receiver_id)
        if cls.is_busy(initiator):
            return {
                "busy": True,
                "detail": "You are already in another call"
            }
        if cls.is_busy(receiver):
            return {
                "busy": True,
                "detail": f"{receiver.username} is busy"
            }
        conversation = get_object_or_404(
            Conversation, id=conversation_id, members=initiator
        )
        call = Call.objects.create(
            conversation=conversation,
            initiator=initiator,
            receiver=receiver,
            call_type=call_type,
            status="ringing",
        )
        return {
            "busy": False,
            "call": call
        }

    @classmethod
    def answer_call(cls, call_id):
        call = get_object_or_404(Call, id=call_id)
        call.status = "ongoing"
        call.answered_at = timezone.now()

        call.save(update_fields=["status", "answered_at"])

        return call

    @classmethod
    def end_call(cls, call_id):
        call = get_object_or_404(Call, id=call_id)
        call.status = "completed"
        call.ended_at = timezone.now()

        if call.answered_at:
            call.duration = int((call.ended_at - call.answered_at).total_seconds())

        call.save()
        return call

    @classmethod
    def decline_call(cls, call_id):

        call = get_object_or_404(Call, id=call_id)
        call.status = "declined"
        call.ended_at = timezone.now()

        call.save(update_fields=["status", "ended_at"])

        return call
