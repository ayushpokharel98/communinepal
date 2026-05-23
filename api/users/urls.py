from django.urls import path
from .views import (
    RegisterView,
    VerifyEmailView,
    ResendVerification,
    LoginView,
    RefreshView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    UserDetailView,
    UserListView,
    SendFriendRequestView,
    AcceptFriendRequestView,
    RejectFriendRequestView,
    CancelFriendRequestView,
    RemoveFriendView,
    FriendListView,
    PendingFriendRequestsView,
    SentFriendRequestsView,
)

urlpatterns = [
    path("me/", MeView.as_view(), name="user"),
    path("<int:id>/", UserDetailView.as_view(), name="other-user"),
    path("users/", UserListView.as_view(), name="user-search"),
    path("register/", RegisterView.as_view(), name="user-register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerification.as_view(), name="resend-verification"),
    path("token/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path(
        "friends/send/<int:user_id>/",
        SendFriendRequestView.as_view(),
        name="send-friend-request",
    ),
    path(
        "friends/accept/<int:friendship_id>/",
        AcceptFriendRequestView.as_view(),
        name="accept-friend-request",
    ),
    path(
        "friends/reject/<int:friendship_id>/",
        RejectFriendRequestView.as_view(),
        name="reject-friend-request",
    ),
    path(
        "friends/cancel/<int:friendship_id>/",
        CancelFriendRequestView.as_view(),
        name="cancel-friend-request",
    ),
    path(
        "friends/remove/<int:friendship_id>/", RemoveFriendView.as_view(), name="remove-friend"
    ),
    path("friends/", FriendListView.as_view(), name="friend-list"),
    path(
        "friends/pending/", PendingFriendRequestsView.as_view(), name="pending-friend-requests"
    ),
    path("friends/sent/", SentFriendRequestsView.as_view(), name="sent-friend-requests"),
]
