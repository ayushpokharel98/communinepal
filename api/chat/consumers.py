from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chat.models import Conversation
from chat.services.message_service import MessageService
from uuid import UUID


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