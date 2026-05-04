from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

class TokenService:
    
    @staticmethod
    def generate_token(user):
        return{
            "uid": urlsafe_base64_encode(force_bytes(user.id)),
            "token": default_token_generator.make_token(user)
        }

    @staticmethod
    def validate(uid, token):
        from ..selectors.user_selector import UserSelector
        
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = UserSelector.get_user_by_id(user_id)
        
        except Exception:
            return None
        
        if not default_token_generator.check_token(user, token):
            return None
        
        return user