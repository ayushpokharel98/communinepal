from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_401_UNAUTHORIZED,
    HTTP_400_BAD_REQUEST,
)
from .services.auth_service import AuthService
from .services.token_service import TokenService
from .services.friend_service import FriendService
from .selectors.user_selector import UserSelector
from .models import Profile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    VerifySerializer,
    ResetPasswordSerializer,
    UserDetailSerializer,
    FriendshipSerializer,
    ProfileSerializer
)
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()
SAMESITE = settings.JWT_COOKIE_SAMESITE
HTTP_ONLY = settings.JWT_COOKIE_HTTP_ONLY
SECURE = settings.JWT_COOKIE_SECURE
ACCESS = settings.JWT_COOKIE_ACCESS
REFRESH = settings.JWT_COOKIE_REFRESH


def set_auth_cookie(response, user):
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    response.set_cookie(
        key=ACCESS,
        value=str(access),
        httponly=HTTP_ONLY,
        secure=SECURE,
        samesite=SAMESITE,
    )
    response.set_cookie(
        key=REFRESH,
        value=str(refresh),
        httponly=HTTP_ONLY,
        secure=SECURE,
        samesite=SAMESITE,
    )


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = VerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)

        try:
            AuthService.verify_email(**s.validated_data)
        except Exception:
            return Response(
                {"error": "Invalid or expired verification link!"},
                status=HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Verified Successfully!"}, status=HTTP_200_OK)


class ResendVerification(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        AuthService.resend_verification(email)

        return Response(
            {"message": "If email exists, verification link is sent."},
            status=HTTP_200_OK,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        user = AuthService.login(**s.validated_data)

        response = Response({"message": "Login successfull"}, status=HTTP_200_OK)

        set_auth_cookie(response, user)

        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH)

        if not refresh_token:
            return Response({"error": "No refresh token"}, status=HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token

            response = Response({"message": "Token Refreshed"}, status=HTTP_200_OK)

            response.set_cookie(
                key=ACCESS,
                value=str(access),
                httponly=HTTP_ONLY,
                secure=SECURE,
                samesite=SAMESITE,
            )

            return response

        except:
            return Response(
                {"error": "Invalid refresh token"}, status=HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.COOKIES.get(REFRESH)

        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass

        response = Response({"message": "Logged out"}, status=HTTP_200_OK)

        response.delete_cookie(REFRESH, path="/", samesite=SAMESITE)
        response.delete_cookie(ACCESS, path="/", samesite=SAMESITE)

        return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        AuthService.forgot_password(email)

        return Response(
            {"message": "If email exists, reset link is sent."}, status=HTTP_200_OK
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        s = VerifySerializer(data=request.query_params)
        s.is_valid(raise_exception=True)

        user = TokenService.validate(**s.validated_data)

        if not user:
            return Response(
                {"error": "Invalid or expired reset link"},
                status=HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Token valid"},
            status=HTTP_200_OK,
        )

    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        AuthService.reset_password(**s.validated_data)

        return Response(
            {"message": "Password reset successful"},
            status=HTTP_200_OK,
        )


class MeView(generics.RetrieveAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class UserDetailIDView(generics.RetrieveAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self, *args, **kwargs):
        return get_object_or_404(Profile, user__id=self.kwargs["id"])
    
class UserDetailUsernameView(generics.RetrieveAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self, *args, **kwargs):
        return get_object_or_404(Profile, user__username=self.kwargs["username"])


class UserListView(generics.ListAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["user__username", "user__first_name", "user__last_name"]
    
    def get_queryset(self):
        return Profile.objects.exclude(user = self.request.user)
    
class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile
    

class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        receiver = UserSelector.get_user_by_id(user_id)
        friendship = FriendService.send_request(sender=request.user, receiver=receiver)

        serializer = FriendshipSerializer(friendship, context={"request": request})

        return Response(serializer.data, status=HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):

        friendship = FriendService.accept_request(friendship_id, request.user)

        serializer = FriendshipSerializer(friendship, context={"request": request})

        return Response(serializer.data)


class RejectFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):

        FriendService.reject_request(friendship_id=friendship_id, user=request.user)

        return Response({"detail": "Friend request rejected"})


class CancelFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friendship_id):

        FriendService.cancel_request(friendship_id=friendship_id, user=request.user)

        return Response({"detail": "Friend request cancelled"})


class RemoveFriendView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, friendship_id):

        FriendService.remove_friend(friendship_id=friendship_id, user=request.user)

        return Response({"detail": "Friend removed"})


class FriendListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):
        return FriendService.get_friends(self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request

        return context


class PendingFriendRequestsView(generics.ListAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):

        return FriendService.get_pending_requests(self.request.user)

    def get_serializer_context(self):

        context = super().get_serializer_context()
        context["request"] = self.request

        return context


class SentFriendRequestsView(generics.ListAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = FriendshipSerializer

    def get_queryset(self):

        return FriendService.get_sent_requests(self.request.user)

    def get_serializer_context(self):

        context = super().get_serializer_context()
        context["request"] = self.request

        return context
