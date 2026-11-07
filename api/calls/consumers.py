from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from calls.models import Call, CallParticipant
from django.db import transaction
from django.utils import timezone
from urllib.parse import parse_qs


class CallConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        query = parse_qs(self.scope.get("query_string", b"").decode())
        self.is_call_session = query.get("role", [""])[0] == "call"
        self.call_id = None
        self.user_group = f"calls_{self.user.id}"

        await self.channel_layer.group_add(self.user_group, self.channel_name)

        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if getattr(self, "call_id", None):
            event, user_ids = await self.drop_call(self.call_id, self.user.id)
            if event:
                await self.send_to_users(
                    user_ids, {"type": event, "call_id": str(self.call_id)}
                )

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")

        handlers = {
            "start_call": self.start_call,
            "accept_call": self.accept_call,
            "reject_call": self.reject_call,
            "cancel_call": self.cancel_call,
            "end_call": self.end_call,
            "offer": self.relay_signaling,
            "answer": self.relay_signaling,
            "ice_candidate": self.relay_signaling,
            "ready": self.relay_signaling,
        }

        handler = handlers.get(event_type)

        if not handler:
            await self.send_error("Unknown event type.")
            return

        await handler(content)

    async def call_event(self, event):
        await self.send_json(event["data"])

    async def start_call(self, content):
        conversation_id = content.get("conversation_id")
        call_type = content.get("call_type")

        if call_type not in ["audio", "video"]:
            await self.send_error("Invalid call type.")
            return

        try:
            result = await self.create_call(conversation_id, self.user.id, call_type)
        except ValueError as err:
            await self.send_error(str(err))
            return

        call_data = result["call"]
        if self.is_call_session:
            self.call_id = call_data["id"]

        await self.send_to_users(
            [result["recipient_id"]], {"type": "incoming_call", "call": call_data}
        )

        await self.send_json({"type": "outgoing_call", "call": call_data})

    async def accept_call(self, content):
        call_id = content.get("call_id")
        try:
            user_ids = await self.update_call_status(
                content.get("call_id"), self.user.id, "accept"
            )
        except ValueError as err:
            await self.send_error(str(err))
            return

        if self.is_call_session:
            self.call_id = call_id

        await self.send_to_users(user_ids, {"type": "call_accepted", "call_id": call_id})
        await self.send_to_users([self.user.id], {"type": "call_handled", "call_id": call_id})

    async def reject_call(self, content):
        try:
            user_ids = await self.update_call_status(
                content.get("call_id"), self.user.id, "reject"
            )
        except ValueError as err:
            await self.send_error(str(err))
            return

        await self.send_to_users(
            user_ids, {"type": "call_rejected", "call_id": content.get("call_id")}
        )
        await self.send_to_users([self.user.id], {"type": "call_handled", "call_id": content.get("call_id")})

    async def cancel_call(self, content):
        try:
            user_ids = await self.finish_call(
                content.get("call_id"), self.user.id, "cancel"
            )
        except ValueError as err:
            await self.send_error(str(err))
            return

        await self.send_to_users(
            user_ids, {"type": "call_cancelled", "call_id": content.get("call_id")}
        )

    async def end_call(self, content):
        try:
            user_ids = await self.finish_call(
                content.get("call_id"), self.user.id, "end"
            )
        except ValueError as err:
            await self.send_error(str(err))
            return

        await self.send_to_users(
            user_ids, {"type": "call_ended", "call_id": content.get("call_id")}
        )

    async def relay_signaling(self, content):
        event_type = content.get("type")
        call_id = content.get("call_id")

        try:
            user_ids = await self.get_call_recipients(call_id, self.user.id)
        except ValueError as err:
            await self.send_error(str(err))
            return

        if event_type in ("offer", "answer"):
            if not content.get("description"):
                await self.send_error("Missing SDP description.")
                return

        elif event_type == "ice_candidate":
            if content.get("candidate") is None:
                await self.send_error("Missing ICE candidate")
                return

        await self.send_to_users(
            user_ids,
            {
                "type": event_type,
                "call_id": call_id,
                "from_user_id": self.user.id,
                "description": content.get("description"),
                "candidate": content.get("candidate"),
            },
        )

    async def send_error(self, message):
        await self.send_json({"type": "error", "message": message})

    async def send_to_users(self, user_ids, data):
        for user_id in user_ids:
            await self.channel_layer.group_send(
                f"calls_{user_id}", {"type": "call_event", "data": data}
            )

    @database_sync_to_async
    def create_call(self, conversation_id, user_id, call_type):
        from chat.models import Conversation

        with transaction.atomic():
            conversation = Conversation.objects.filter(id=conversation_id).first()

            if not conversation:
                raise ValueError("Conversation not found")

            members = list(conversation.members.all())

            if not any(member.id == user_id for member in members):
                raise ValueError("You are not a member in this conversation")

            if len(members) != 2:
                raise ValueError("Calls currently support two users only")

            recipient = next(member for member in members if member.id != user_id)

            call = Call.objects.create(
                conversation=conversation,
                initiated_by_id=user_id,
                call_type=call_type,
                status=Call.Status.RINGING,
            )

            CallParticipant.objects.create(
                call=call,
                user_id=user_id,
                role=CallParticipant.Role.INITIATOR,
                status=CallParticipant.Status.ACCEPTED,
                joined_at=timezone.now(),
            )

            CallParticipant.objects.create(
                call=call,
                user=recipient,
                role=CallParticipant.Role.PARTICIPANT,
                status=CallParticipant.Status.INVITED,
            )

            caller = next(member for member in members if member.id == user_id)

            return {
                "recipient_id": recipient.id,
                "call": {
                    "id": str(call.id),
                    "conversation_id": str(conversation.id),
                    "call_type": call.call_type,
                    "initiated_by": user_id,
                    "initiator": {
                        "id": caller.id,
                        "username": caller.username,
                        "full_name": caller.full_name,
                        "profile_picture": caller.profile.profile_picture.url,
                    },
                },
            }

    @database_sync_to_async
    def update_call_status(self, call_id, user_id, action):
        with transaction.atomic():
            call = Call.objects.select_for_update().filter(id=call_id).first()

            if not call or call.status != Call.Status.RINGING:
                raise ValueError("This call is not longer available.")

            participant = (
                CallParticipant.objects.select_for_update()
                .filter(call=call, user_id=user_id)
                .first()
            )

            if not participant:
                raise ValueError("You are not a participant of this call.")

            if action == "accept":
                if participant.status != CallParticipant.Status.INVITED:
                    raise ValueError("You can't accept this call")

                participant.status = CallParticipant.Status.ACCEPTED
                participant.joined_at = timezone.now()
                participant.save(update_fields=["status", "joined_at"])

                call.status = Call.Status.ACTIVE
                call.answered_at = timezone.now()

                call.save(update_fields=["status", "answered_at"])

            elif action == "reject":
                if participant.status != CallParticipant.Status.INVITED:
                    raise ValueError("You can't reject this call.")

                participant.status = CallParticipant.Status.REJECTED
                participant.left_at = timezone.now()
                participant.save(update_fields=["status", "left_at"])

                call.status = Call.Status.REJECTED
                call.ended_at = timezone.now()
                call.save(update_fields=["status", "ended_at"])

            return list(
                call.participants.exclude(user_id=user_id).values_list(
                    "user_id", flat=True
                )
            )

    @database_sync_to_async
    @transaction.atomic
    def finish_call(self, call_id, user_id, action):
        call = Call.objects.select_for_update().filter(id=call_id).first()

        if not call:
            raise ValueError("Call not found.")

        participant = CallParticipant.objects.filter(call=call, user_id=user_id).first()

        if not participant:
            raise ValueError("You are not a participant in this call")

        if action == "cancel":
            if call.initiated_by_id != user_id:
                raise ValueError("Only caller can cancel the call")

            if call.status != Call.Status.RINGING:
                raise ValueError("This call can't be cancelled")

            call.status = Call.Status.CANCELLED

        if action == "end":
            if call.status != Call.Status.ACTIVE:
                raise ValueError("This call can't be ended")

            call.status = Call.Status.ENDED

        call.ended_at = timezone.now()

        call.save(update_fields=["status", "ended_at"])

        call.participants.filter(
            status__in=[CallParticipant.Status.INVITED, CallParticipant.Status.ACCEPTED]
        ).update(status=CallParticipant.Status.LEFT, left_at=timezone.now())

        return list(
            call.participants.exclude(user_id=user_id).values_list("user_id", flat=True)
        )

    @database_sync_to_async
    def get_call_recipients(self, call_id, user_id):
        call = Call.objects.filter(id=call_id, status=Call.Status.ACTIVE).first()

        if not call:
            raise ValueError("Call is not active.")

        participant = CallParticipant.objects.filter(
            call=call, user_id=user_id, status=CallParticipant.Status.ACCEPTED
        ).first()

        if not participant:
            raise ValueError("You are not accepted participant")

        return list(
            call.participants.filter(status=CallParticipant.Status.ACCEPTED)
            .exclude(user_id=user_id)
            .values_list("user_id", flat=True)
        )
        
    @database_sync_to_async
    def drop_call(self, call_id, user_id):
        with transaction.atomic():
            call = Call.objects.select_for_update().filter(id=call_id).first()
            if not call or call.status not in (Call.Status.RINGING, Call.Status.ACTIVE):
                return None, []

            if call.status == Call.Status.ACTIVE:
                call.status, event = Call.Status.ENDED, "call_ended"
            elif call.initiated_by_id == user_id:
                call.status, event = Call.Status.CANCELLED, "call_cancelled"
            else:
                call.status, event = Call.Status.REJECTED, "call_rejected"

            now = timezone.now()
            call.ended_at = now
            call.save(update_fields=["status", "ended_at"])
            call.participants.filter(
                status__in=[CallParticipant.Status.INVITED, CallParticipant.Status.ACCEPTED]
            ).update(status=CallParticipant.Status.LEFT, left_at=now)

            others = list(call.participants.exclude(user_id=user_id).values_list("user_id", flat=True))
            return event, others
