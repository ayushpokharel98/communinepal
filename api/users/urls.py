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
    UserDetailView
)
urlpatterns = [
    path('me/', MeView.as_view(), name="user"),
    path('<int:pk>/', UserDetailView.as_view(), name="other-user"),
    path("register/", RegisterView.as_view(), name="user-register"),
    path('verify-email/', VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerification.as_view(), name="resend-verification"),
    path("token/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
]
