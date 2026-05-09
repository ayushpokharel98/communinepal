from rest_framework import serializers
from .models import Profile
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from .services.auth_service import AuthService

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
    class Meta:
        fields = ['user', 'bio', 'phone_number', 'gender', 'address', 'website', 'date_of_birth', 'profile_picture', 'cover_picture']
        model = Profile