from .models import Message, Conversation, MessageSeen, Call, TimelineEvent
from rest_framework import serializers
from django.contrib.auth import get_user_model
from os import getenv

User = get_user_model()
SITE_URL = getenv("SITE_URL")


class UserBasicSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "profile_picture", "full_name"]

    def get_profile_picture(self, obj):
        return f"{SITE_URL}{obj.profile.profile_picture.url}"


class MessageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    conversation = serializers.UUIDField(
        source="conversation.id",
        read_only=True
    )
    parent = serializers.UUIDField(
        source="parent.id",
        read_only=True,
        allow_null=True
    )
    sender = UserBasicSerializer()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "content",
            "parent",
            "created_at",
            "is_deleted",
            "is_edited",
        ]

class CallSerializer(serializers.ModelSerializer):
    initiator = UserBasicSerializer(read_only = True)
    receiver = UserBasicSerializer(read_only = True)
    conversation = serializers.UUIDField(source="conversation.id")
    duration = serializers.SerializerMethodField()
    class Meta:
        model = Call
        fields = [
            "id",
            "conversation",
            "initiator",
            "receiver",
            "call_type",
            "status",
            "started_at",
            "answered_at",
            "ended_at",
            "duration",
        ]
    def get_duration(self, obj):
        if obj.started_at and obj.ended_at:
            return int((obj.answered_at-obj.started_at).total_seconds())
        return None

class TimelineEventSerializer(serializers.ModelSerializer):
    data = serializers.SerializerMethodField()
    
    class Meta:
        model = TimelineEvent
        fields = [
            "id",
            "created_at",
            "type",
            "data"
        ]
    
    def get_data(self, obj):
        if obj.type == obj.EventType.MESSAGE:
            return MessageSerializer(obj.message).data
        return CallSerializer(obj.call).data


class ConversationSerializer(serializers.ModelSerializer):
    members = UserBasicSerializer(many=True)
    last_event = TimelineEventSerializer()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "members",
            "created_at",
            "updated_at",
            "last_event",
            "other_user",
        ]

    def get_other_user(self, obj):
        request = self.context["request"]
        other_user = (
            obj.members.exclude(id=request.user.id).select_related("profile").first()
        )
        if not other_user:
            return None
        return UserBasicSerializer(other_user).data
    
class ConversationCreateSerializer(serializers.Serializer):
    username = serializers.CharField()


class MessageUpdateSerializer(serializers.Serializer):
    content = serializers.CharField()