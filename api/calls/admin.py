from django.contrib import admin
from calls.models import Call, CallParticipant

admin.site.register(Call)
admin.site.register(CallParticipant)