from django.contrib import admin
from .models import Conversation, Message, MessageSeen, Call, TimelineEvent
admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(MessageSeen)
admin.site.register(Call)
admin.site.register(TimelineEvent)