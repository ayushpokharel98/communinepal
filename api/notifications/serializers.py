from notifications.models import Notification
from rest_framework import serializers
from django.conf import settings

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only = True)
    actor_profile_picture = serializers.SerializerMethodField()
    class Meta:
        model = Notification
        fields = ["id", "actor_username", "actor_profile_picture", "notification_type", "title", "message", "created_at", "is_read", "data"]
        
    def get_actor_profile_picture(self, obj):
        profile_picture = getattr(obj.actor.profile, "profile_picture")
        if not profile_picture:
            return None
        
        return f"{settings.SITE_URL}{profile_picture.url}"
