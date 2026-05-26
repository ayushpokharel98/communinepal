from django.urls import path
from .views import (
    PostListCreateView,
    PostDetailView,
    PostUpdateView,
    PostDeleteView,
    PostLikeView,
    PostShareView,
    CommentListCreateView,
    CommentUpdateView,
    CommentDeleteView,
    ReplyUpdateView,
    ReplyDeleteView
)

urlpatterns = [
    path("", PostListCreateView.as_view(), name="post-list-create"),
    path("<uuid:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("<uuid:pk>/update/", PostUpdateView.as_view(), name="post-update"),
    path("<uuid:pk>/delete/", PostDeleteView.as_view(), name="post-delete"),
    path("<uuid:pk>/like/", PostLikeView.as_view(), name="post-like"),
    path("<uuid:pk>/share/", PostShareView.as_view(), name="post-share"),
    path(
        "<uuid:pk>/comments/",
        CommentListCreateView.as_view(),
        name="comment-list-create",
    ),
    path(
        "comments/<uuid:pk>/update/", CommentUpdateView.as_view(), name="comment-update"
    ),
    path(
        "comments/<uuid:pk>/delete/", CommentDeleteView.as_view(), name="comment-delete"
    ),
    path("replies/<uuid:pk>/update/", ReplyUpdateView.as_view(), name="reply-update"),
    path("replies/<uuid:pk>/delete/", ReplyDeleteView.as_view(), name="reply-delete"),
]
