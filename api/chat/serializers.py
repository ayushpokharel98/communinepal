from .models import Message, Conversation, MessageSeen
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()
class UserBasicSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ReadOnlyField(source = "profile.profile_picture")
    class Meta:
        model = User
        fields = ["username", "profile_picture", "full_name"]
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        
        fields = ["id", "conversation", "content", "parent", "created_at", "is_deleted", "is_edited"]
        
class ConversationSerializer(serializers.ModelSerializer):
    members = UserBasicSerializer(many = True)
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = ["id", "members", "created_at", "updated_at"]
        
    def get_last_message(self, obj):
        message = obj.messages.last()
        
        if not message:
            return None
        
        return MessageSerializer(message).data

    def get_other_user(self, obj):
        request = self.context["request"]
        other_user = obj.members.exclude(id=request.user.id).select_related("profile").first()
        if not other_user:
            return None
        return {
            "id": other_user.id,
            "username": other_user.username,
            "full_name": other_user.full_name,
            "profile_picture": request.build_absolute_uri(other_user.profile.profile_picture.url)
        }
    
class ConversationCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    
class MessageUpdateSerializer(serializers.Serializer):
    content = serializers.CharField()
    
        