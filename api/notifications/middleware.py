from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import AccessToken

class JWTAuthMiddleware:

    def __init__(self, inner):
        self.inner = inner

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):
        from django.contrib.auth.models import AnonymousUser
        scope["user"] = AnonymousUser()

        headers = dict(scope["headers"])

        cookie_header = headers.get(
            b"cookie",
            b"",
        ).decode()

        cookies = {}

        if cookie_header:

            for item in cookie_header.split(";"):

                if "=" not in item:
                    continue

                key, value = item.strip().split(
                    "=",
                    1,
                )

                cookies[key] = value

        token = cookies.get(settings.JWT_COOKIE_ACCESS)

        if token:

            try:

                access_token = AccessToken(token)

                user = await self.get_user(access_token["user_id"])

                scope["user"] = user

            except Exception:
                pass

        return await self.inner(
            scope,
            receive,
            send,
        )

    @database_sync_to_async
    def get_user(self, user_id):
        from django.contrib.auth.models import AnonymousUser

        User = get_user_model()

        try:
            return User.objects.get(id=user_id)

        except User.DoesNotExist:
            return AnonymousUser()


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
