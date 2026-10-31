from .models import Message, Conversation, MessageSeen, MessageMedia, ConversationUserState
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


class MessageMediaSerializer(serializers.ModelSerializer):
    media_url = serializers.SerializerMethodField()
    media_type = serializers.CharField(required=False)

    class Meta:
        model = MessageMedia
        fields = ["id", "created_at", "media_url", "media_type"]

    def get_media_url(self, obj):
        if not obj.file:
            return None
        return obj.file.url


class MessageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    conversation = serializers.UUIDField(source="conversation.id", read_only=True)
    parent = serializers.SerializerMethodField()
    sender = UserBasicSerializer()
    media = MessageMediaSerializer(many=True, read_only=True)

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
            "media",
        ]

    def get_parent(self, obj):
        if not obj.parent:
            return None

        return MessageSerializer(obj.parent, include_parent=False).data

    def __init__(self, *args, include_parent=True, **kwargs):
        super().__init__(*args, **kwargs)

        self.include_parent = include_parent

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.is_deleted:
            data["content"] = ""
            data["media"] = []
            data["parent"] = None
            data["is_edited"] = False

        if not self.include_parent:
            data["parent"] = None

        return data


class ConversationSerializer(serializers.ModelSerializer):
    members = UserBasicSerializer(many=True)
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "members",
            "created_at",
            "updated_at",
            "last_message",
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
    
    def get_last_message(self, obj):
        request = self.context["request"]
        
        state = ConversationUserState.objects.filter(conversation=obj, user=request.user).first()
        
        messages = Message.objects.filter(
            conversation=obj,
        )
        
        if state and state.cleared_at:
            messages = messages.filter(
                created_at__gte = state.cleared_at
            )
        
        last_message = messages.order_by("-created_at").first()
        
        if not last_message:
            return None
        
        return MessageSerializer(last_message, context=self.context).data


class ConversationCreateSerializer(serializers.Serializer):
    username = serializers.CharField()


class MessageSendSerializer(serializers.Serializer):
    conversation_id = serializers.UUIDField()
    parent_id = serializers.UUIDField(required=False)
    content = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=3000
    )
    uploaded_files = serializers.ListField(
        child=serializers.FileField(), required=False, default=list
    )
    media_types = serializers.ListField(
        child=serializers.ChoiceField(
            choices=MessageMedia.MediaType.choices, required=False, default=list
        ),
        required=False,
    )

    def validate(self, attrs):
        files = attrs.get("uploaded_files", [])
        content = attrs.get("content", "").strip()
        media_types = attrs.get("media_types", [])

        if not content and not files:
            raise serializers.ValidationError("There must be some content or media.")

        if len(files) != len(media_types):
            raise serializers.ValidationError("files length and media_types mismatch.")

        if len(files) > 10:
            raise serializers.ValidationError("Maximum of 10 files allowed.")

        return attrs


class MessageUpdateSerializer(serializers.Serializer):
    content = serializers.CharField()
