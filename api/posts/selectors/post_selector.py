from django.db.models import (
    Count,
    Exists,
    OuterRef,
    Prefetch,
    Q,
)

from ..models import (
    Post,
    Comment,
    Like,
    Share,
)

from users.models import Friendship, FriendshipStatus


class PostSelector:

    # =========================
    # BASE QUERYSET
    # =========================

    @staticmethod
    def base_post_queryset(user=None):

        queryset = (
            Post.objects
            .filter(is_deleted=False)
            .select_related(
                "author",
                "author__profile",
            )
            .prefetch_related("media")
            .annotate(
                likes_count=Count(
                    "likes",
                    distinct=True,
                ),
                comments_count=Count(
                    "comments",
                    filter=Q(comments__is_deleted=False),
                    distinct=True,
                ),
                shares_count=Count(
                    "shares",
                    distinct=True,
                ),
            )
        )

        # Add user-specific annotations
        if user and user.is_authenticated:

            liked_subquery = Like.objects.filter(
                post=OuterRef("pk"),
                user=user,
            )

            shared_subquery = Share.objects.filter(
                post=OuterRef("pk"),
                user=user,
            )

            queryset = queryset.annotate(
                is_liked=Exists(liked_subquery),
                is_shared=Exists(shared_subquery),
            )

        return queryset

    # =========================
    # FEED
    # =========================

    @staticmethod
    def get_feed(user):

        friendships = Friendship.objects.filter(
            Q(user1=user) | Q(user2=user),
            status=FriendshipStatus.ACCEPTED,
        ).values_list("user1_id", "user2_id")

        friend_ids = {user.id}

        for user1_id, user2_id in friendships:

            if user1_id == user.id:
                friend_ids.add(user2_id)
            else:
                friend_ids.add(user1_id)

        return (
            PostSelector.base_post_queryset(user=user)
            .filter(author_id__in=friend_ids)
            .order_by("-created_at")
        )

    # =========================
    # USER POSTS
    # =========================

    @staticmethod
    def get_user_posts(*, target_user, request_user=None):

        return (
            PostSelector.base_post_queryset(user=request_user)
            .filter(author=target_user)
            .order_by("-created_at")
        )

    # =========================
    # SINGLE POST
    # =========================

    @staticmethod
    def get_post_by_id(*, post_id, user=None):
        return (
            PostSelector.base_post_queryset(user=user)
            .get(id=post_id)
        )

    # =========================
    # COMMENTS
    # =========================

    @staticmethod
    def get_comments(post_id):

        replies_queryset = (
            Comment.objects
            .filter(is_deleted=False)
            .select_related(
                "author",
                "author__profile",
            )
            .order_by("created_at")
        )

        return (
            Comment.objects
            .filter(
                post_id=post_id,
                parent=None,
                is_deleted=False,
            )
            .select_related(
                "author",
                "author__profile",
            )
            .prefetch_related(
                Prefetch(
                    "replies",
                    queryset=replies_queryset,
                )
            )
            .order_by("created_at")
        )
        
    @staticmethod
    def get_shares(user_id):
        return (
            Share.objects
            .filter(user_id=user_id, post__is_deleted = False).select_related("user","user__profile","post","post__author","post__author__profile").prefetch_related("post__media").order_by("-shared_at"))