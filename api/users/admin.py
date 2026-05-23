from django.contrib import admin
from .models import CustomUser, Profile, Friendship

admin.site.register(CustomUser)
admin.site.register(Profile)
admin.site.register(Friendship)