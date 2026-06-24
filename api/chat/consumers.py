from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chat.models import Conversation
from chat.services.message_service import MessageService
from uuid import UUID
from chat.services.call_service import CallService


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return
        self.conversation_id = str(self.scope["url_route"]["kwargs"]["conversation_id"])

        allowed = await self.can_join()
        if not allowed:
            await self.close()
            return

        self.group_name = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event = content.get("type")

        if event == "message":
            await self.handle_message(content)
        elif event == "message_edit":
            await self.handle_edit(content)
        elif event == "message_delete":
            await self.handle_delete(content)

    async def handle_message(self, data):
        content = data.get("content", "")

        if not content:
            return

        parent_id = data.get("parent_id")
        await self.send_message(content, parent_id)

    async def handle_edit(self, data):
        message_id = data.get("message_id")
        content = data.get("content")

        if not message_id or not content:
            return

        await self.edit_message(message_id, content)

    async def handle_delete(self, data):
        message_id = data.get("message_id")
        if not message_id:
            return
        await self.delete_message(message_id)

    async def chat_event(self, event):
        await self.send_json({"type": event["event"], "data": event["data"]})

    @database_sync_to_async
    def can_join(self):
        return Conversation.objects.filter(
            id=self.conversation_id, members=self.user
        ).exists()

    @database_sync_to_async
    def send_message(self, content, parent_id):
        MessageService.send_message(
            sender=self.user,
            conversation_id=self.conversation_id,
            content=content,
            parent_id=parent_id,
        )

    @database_sync_to_async
    def edit_message(self, message_id, content):
        MessageService.edit_message(self.user, message_id, content)

    @database_sync_to_async
    def delete_message(self, message_id):
        MessageService.delete_message(self.user, message_id)


class ConversationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"conversation_{self.user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_conversation_data(self, event):
        await self.send_json({"type": event["event"], "data": event["data"]})


class CallConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f"call_{self.user.id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        event = content.get("type")

        if event == "call_offer":
            await self.handle_offer(content)
        elif event == "call_answer":
            await self.handle_answer(content)
        elif event == "ice_candidate":
            await self.handle_ice(content)
        elif event == "call_end":
            await self.handle_end(content)

    async def handle_offer(self, data):

        receiver_id = data.get("receiver_id")

        call = await self.create_call(
            receiver_id, data.get("conversation_id"), data.get("call_type")
        )

        await self.send_to_user(
            receiver_id,
            {
                "type": "call_offer",
                "call_id": str(call.id),
                "offer": data.get("offer"),
                "caller_id": self.user.id,
                "call_type": call.call_type,
            },
        )

    async def handle_answer(self, data):

        await self.send_to_user(
            data["receiver_id"],
            {
                "type": "call_answer",
                "answer": data.get("answer"),
                "call_id": data.get("call_id"),
            },
        )

        await self.mark_answered(data.get("call_id"))

    async def handle_ice(self, data):

        await self.send_to_user(
            data["receiver_id"],
            {"type": "ice_candidate", "candidate": data.get("candidate")},
        )

    async def handle_end(self, data):

        await self.end_call(data.get("call_id"))

        await self.send_to_user(
            data.get("receiver_id"),
            {"type": "call_end", "call_id": data.get("call_id")},
        )
    
    async def handle_decline(self,data):
        await self.decline_call(
            data["call_id"]
        )
        await self.send_to_user(
            data["caller_id"],
            {
                "type":"call_declined"
            }

        )

    async def send_to_user(self, user_id, message):

        await self.channel_layer.group_send(
            f"call_{user_id}", {"type": "call_event", "data": message}
        )

    async def call_event(self, event):

        await self.send_json(event["data"])

    @database_sync_to_async
    def create_call(self, receiver, conversation, call_type):

        return CallService.create_call(self.user, receiver, conversation, call_type)

    @database_sync_to_async
    def mark_answered(self, call_id):

        return CallService.answer_call(call_id)

    @database_sync_to_async
    def end_call(self, call_id):

        return CallService.end_call(call_id)

    @database_sync_to_async
    def decline_call(self, call_id):

        return CallService.decline_call(call_id)