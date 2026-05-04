from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from ..models import Profile
from .email_service import EmailService
from .token_service import TokenService
from ..selectors.user_selector import UserSelector
from rest_framework.exceptions import ValidationError, AuthenticationFailed

User = get_user_model()
class AuthService:
    
    @staticmethod
    def register(data):
        from django.db import transaction
        
        with transaction.atomic():
            user = User.objects.create(**data)
            Profile.objects.create(user = user)
            
            EmailService.send_verification(user)
        
        return user
    
    @staticmethod
    def verify_email(uidb64, token):
        user = TokenService.validate(uidb64, token)
        
        if not user:
            raise Exception("Invalid or expired token")
        
        user.is_verified = True
        user.save()
        
        return user
    
    @staticmethod
    def login(email, password):
        user = UserSelector.get_user_by_email(email)
        
        if not user or user.check_password(password):
            raise Exception("Invalid credentials")
        
        if not user.is_verified:
            raise Exception("Please verify your email first")
        
        update_last_login(None, user)
        
        return user
    
    @staticmethod
    def resend_verification(email):
        user = UserSelector.get_user_by_email(email)
        
        if user and not user.is_verified:
            EmailService.send_verification(email)
    
    @staticmethod
    def forgot_password(email):
        user = UserSelector.get_user_by_email(email)
        
        if user:
            EmailService.send_password_reset(user)
            
    @staticmethod
    def reset_password(uidb64, token, new_password):
        user = TokenService.validate(uidb64, token)
        
        if not user:
            raise AuthenticationFailed({"token":"Invalid or expired token"})
        
        if user.check_password(new_password):
            raise ValidationError({"new_password" : "New and old password can't be same"})
        
        user.set_password(new_password)
        user.save()
        