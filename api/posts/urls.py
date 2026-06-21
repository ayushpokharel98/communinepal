from django.urls import path

from .views import (
    PostListCreateView,
    UserPostsView,
    PostDetailView,
    PostUpdateView,
    PostDeleteView,
    PostLikeView,
    PostShareView,
    CommentListCreateView,
    CommentUpdateView,
    CommentDeleteView,
    ReplyUpdateView,
    ReplyDeleteView,
    ShareRetrieveView
)

urlpatterns = [

    # ==========================================
    # POSTS
    # ==========================================

    path(
        "",
        PostListCreateView.as_view(),
        name="feed",
    ),

    path(
        "user/<int:user_id>/",
        UserPostsView.as_view(),
        name="user-posts",
    ),

    path(
        "<uuid:pk>/",
        PostDetailView.as_view(),
        name="detail",
    ),

    path(
        "<uuid:pk>/update/",
        PostUpdateView.as_view(),
        name="update",
    ),

    path(
        "<uuid:pk>/delete/",
        PostDeleteView.as_view(),
        name="delete",
    ),

    path(
        "<uuid:pk>/like/",
        PostLikeView.as_view(),
        name="like",
    ),

    path(
        "<uuid:pk>/share/",
        PostShareView.as_view(),
        name="share",
    ),
    
     path(
        "user/<int:pk>/shares/",
        ShareRetrieveView.as_view(),
        name="user-shares",
    ),

    path(
        "<uuid:pk>/comments/",
        CommentListCreateView.as_view(),
        name="comments",
    ),

    path(
        "comments/<uuid:pk>/update/",
        CommentUpdateView.as_view(),
        name="comment-update",
    ),

    path(
        "comments/<uuid:pk>/delete/",
        CommentDeleteView.as_view(),
        name="comment-delete",
    ),

    path(
        "replies/<uuid:pk>/update/",
        ReplyUpdateView.as_view(),
        name="reply-update",
    ),

    path(
        "replies/<uuid:pk>/delete/",
        ReplyDeleteView.as_view(),
        name="reply-delete",
    ),
]