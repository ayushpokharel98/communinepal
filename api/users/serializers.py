from rest_framework import serializers
from .models import Profile, Friendship
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from .services.auth_service import AuthService
from .services.friend_service import FriendService

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True, validators = [validate_password])
    class Meta:
        fields = ["username", "email", "first_name", "last_name", "password"]
        model = User
        
    def create(self, validated_data):
        return AuthService.register(**validated_data)
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
class VerifySerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()

class ResetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only = True, validators = [validate_password])
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "username", "email", "first_name", "last_name", "full_name", "is_verified", "last_login", "date_joined"]
        model = User
        
        
class UserDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    is_friend = serializers.SerializerMethodField()
    request_pending = serializers.SerializerMethodField()
    class Meta:
        fields = ['user', 'bio', 'phone_number', 'gender', 'address', 'website', 'date_of_birth', 'profile_picture', 'cover_picture', 'is_friend', 'request_pending']
        model = Profile
    
    def get_is_friend(self, obj):
        request = self.context.get("request")
        
        if not request or not request.user.is_authenticated:
            return False
        
        return FriendService.are_friends(
            request.user,
            obj.user
        )
    
    def get_request_pending(self, obj):
        request = self.context.get("request")
        
        if not request or not request.user.is_authenticated:
            return False
        
        return FriendService.request_pending(
            request.user,
            obj.user
        )
        
        
class FriendshipSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Friendship
        fields = ["id", "status", "requested_by", "created_at", "updated_at", "other_user"]
        
    def get_other_user(self, obj):
        request = self.context.get("request")
        
        user = request.user
        
        other = obj.other_user(user)
        
        return {
            "id" : other.id,
            "username": other.username,
            "profile_picture": request.build_absolute_uri(other.profile.profile_picture.url)
        }