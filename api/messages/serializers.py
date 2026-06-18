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
    class Meta:
        model = Conversation
        fields = ["id", "members", "created_at", "updated_at"]
        
    def get_last_message(self, obj):
        message = obj.messages.last()
        
        if not message:
            return None
        
        return MessageSerializer(message).data
    
class ConversationCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    
class MessageUpdateSerializer(serializers.Serializer):
    content = serializers.CharField()
    
        