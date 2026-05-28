from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import (
    PermissionDenied,
    ValidationError,
)

from ..models import (
    Post,
    PostMedia,
    Like,
    Comment,
    Share,
)


class PostService:

    MAX_MEDIA_FILES = 10

    # =========================
    # POSTS
    # =========================

    @staticmethod
    @transaction.atomic
    def create_post(
        *,
        author,
        caption="",
        uploaded_files=None,
        media_types=None,
    ):
        files = uploaded_files or []
        types = media_types or []

        if len(files) != len(types):
            raise ValidationError(
                "uploaded_files and media_types length mismatch."
            )

        if len(files) > PostService.MAX_MEDIA_FILES:
            raise ValidationError(
                f"Maximum {PostService.MAX_MEDIA_FILES} media files allowed."
            )

        post = Post.objects.create(
            author=author,
            caption=caption,
        )

        media_objects = []

        for order, (file, media_type) in enumerate(zip(files, types)):

            media_objects.append(
                PostMedia(
                    post=post,
                    file=file,
                    media_type=media_type,
                    order=order,
                )
            )

        if media_objects:
            PostMedia.objects.bulk_create(media_objects)

        return post

    @staticmethod
    def update_post(*, post_id, user, caption):
        post = get_object_or_404(
            Post,
            id=post_id,
            is_deleted=False,
        )

        if post.author_id != user.id:
            raise PermissionDenied(
                "You can only edit your own posts."
            )

        post.caption = caption
        post.save(update_fields=["caption", "updated_at"])

        return post

    @staticmethod
    def delete_post(*, post_id, user):
        post = get_object_or_404(
            Post,
            id=post_id,
            is_deleted=False,
        )

        if post.author_id != user.id:
            raise PermissionDenied(
                "You can only delete your own posts."
            )

        # Soft delete
        post.is_deleted = True
        post.save(update_fields=["is_deleted"])

    # =========================
    # LIKES
    # =========================

    @staticmethod
    @transaction.atomic
    def toggle_like(*, post_id, user):

        post = get_object_or_404(
            Post,
            id=post_id,
            is_deleted=False,
        )

        like = Like.objects.filter(
            user=user,
            post=post,
        ).first()

        if like:
            like.delete()
            liked = False
        else:
            Like.objects.create(
                user=user,
                post=post,
            )
            liked = True

        return {
            "liked": liked,
            "likes_count": Like.objects.filter(
                post=post
            ).count(),
        }

    # =========================
    # COMMENTS
    # =========================

    @staticmethod
    def add_comment(
        *,
        post_id,
        author,
        body,
        parent_id=None,
    ):
        post = get_object_or_404(
            Post,
            id=post_id,
            is_deleted=False,
        )

        parent = None

        if parent_id:

            parent = get_object_or_404(
                Comment,
                id=parent_id,
                post=post,
                is_deleted=False,
            )

            # Prevent infinite nesting
            if parent.parent is not None:
                raise ValidationError(
                    "Only one level of replies is allowed."
                )

        return Comment.objects.create(
            post=post,
            author=author,
            parent=parent,
            body=body,
        )

    @staticmethod
    def update_comment(
        *,
        comment_id,
        body,
        user,
    ):
        comment = get_object_or_404(
            Comment,
            id=comment_id,
            is_deleted=False,
        )

        if comment.author_id != user.id:
            raise PermissionDenied(
                "You can only edit your own comments."
            )

        comment.body = body

        comment.save(update_fields=[
            "body",
            "updated_at",
        ])

        return comment

    @staticmethod
    def delete_comment(*, comment_id, user):

        comment = get_object_or_404(
            Comment,
            id=comment_id,
            is_deleted=False,
        )

        if comment.author_id != user.id:
            raise PermissionDenied(
                "You can only delete your own comments."
            )

        # Soft delete
        comment.is_deleted = True

        comment.save(update_fields=["is_deleted"])

    # =========================
    # REPLIES
    # =========================

    @staticmethod
    def update_reply(
        *,
        reply_id,
        user,
        body,
    ):
        reply = get_object_or_404(
            Comment,
            id=reply_id,
            is_deleted=False,
        )

        if reply.parent is None:
            raise ValidationError(
                "This is not a reply."
            )

        if reply.author_id != user.id:
            raise PermissionDenied(
                "You can only edit your own replies."
            )

        reply.body = body

        reply.save(update_fields=[
            "body",
            "updated_at",
        ])

        return reply

    @staticmethod
    def delete_reply(*, reply_id, user):

        reply = get_object_or_404(
            Comment,
            id=reply_id,
            is_deleted=False,
        )

        if reply.parent is None:
            raise ValidationError(
                "This is not a reply."
            )

        if reply.author_id != user.id:
            raise PermissionDenied(
                "You can only delete your own replies."
            )

        reply.is_deleted = True

        reply.save(update_fields=["is_deleted"])

    # =========================
    # SHARES
    # =========================

    @staticmethod
    @transaction.atomic
    def toggle_share(
        *,
        user,
        post_id,
        note="",
    ):
        post = get_object_or_404(
            Post,
            id=post_id,
            is_deleted=False,
        )

        share = Share.objects.filter(
            user=user,
            post=post,
        ).first()

        if share:
            share.delete()
            shared = False

        else:
            Share.objects.create(
                user=user,
                post=post,
                note=note,
            )

            shared = True

        return {
            "shared": shared,
            "shares_count": Share.objects.filter(
                post=post
            ).count(),
        }