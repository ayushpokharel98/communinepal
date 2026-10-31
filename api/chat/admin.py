from django.contrib import admin
from .models import Conversation, Message, MessageSeen, MessageMedia, ConversationUserState
admin.site.register(Conversation)
admin.site.register(ConversationUserState)
admin.site.register(Message)
admin.site.register(MessageSeen)
admin.site.register(MessageMedia)