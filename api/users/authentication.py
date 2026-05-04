from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access = request.COOKIES.get(settings.JWT_COOKIE_ACCESS)
        if not access:
            return None
        try:
            validated_token = self.get_validated_token(access)
            user = self.get_user(validated_token)

            return (user, validated_token)
        except InvalidToken:
            return None
