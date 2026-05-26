from django.shortcuts import get_object_or_404
from ..models import Post, PostMedia, Like, Comment, Share


class PostService:

    @staticmethod
    def create_post(author, caption, uploaded_files=None, media_types=None):
        post = Post.objects.create(author=author, caption=caption)

        files = uploaded_files or []
        types = media_types or []

        for order, (file, media_type) in enumerate(zip(files, types)):
            PostMedia.objects.create(
                post=post,
                file=file,
                media_type=media_type,
                order=order,
            )

        return post

    @staticmethod
    def update_post(post_id, user, caption):
        post = get_object_or_404(Post, id=post_id)

        if post.author != user:
            raise PermissionError("You can only edit your own posts.")

        post.caption = caption
        post.save(update_fields=["caption", "updated_at"])
        return post

    @staticmethod
    def delete_post(post_id, user):
        post = get_object_or_404(Post, id=post_id)

        if post.author != user:
            raise PermissionError("You can only delete your own posts.")

        post.delete()

    @staticmethod
    def toggle_like(post_id, user):
        post = get_object_or_404(Post, id=post_id)

        like, created = Like.objects.get_or_create(user=user, post=post)

        if not created:
            like.delete()

        return {"liked": created, "likes_count": post.likes.count()}

    @staticmethod
    def add_comment(post_id, author, body, parent_id=None):
        post = get_object_or_404(Post, id=post_id)

        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, post=post)

        return Comment.objects.create(
            post=post,
            author=author,
            parent=parent,
            body=body,
        )

    @staticmethod
    def update_comment(comment_id, body, user):
        comment = get_object_or_404(Comment, id=comment_id)

        if comment.author != user:
            raise PermissionError("You can only edit your own comments.")

        comment.body = body
        comment.save(update_fields=["body", "updated_at"])

        return comment

    @staticmethod
    def delete_comment(comment_id, user):
        comment = get_object_or_404(Comment, id=comment_id)

        if comment.author != user:
            raise PermissionError("You can only delete your own comments.")

        comment.delete()

    @staticmethod
    def update_reply(reply_id, user, body):
        reply = get_object_or_404(Comment, id=reply_id)

        if reply.parent is None:
            raise ValueError("This is a top-level comment, not a reply.")

        if reply.author != user:
            raise PermissionError("You can only edit your own replies.")

        reply.body = body
        reply.save(update_fields=["body", "updated_at"])
        return reply

    @staticmethod
    def delete_reply(reply_id, user):
        reply = get_object_or_404(Comment, id=reply_id)
        
        if reply.parent is None:
            raise ValueError("This is a top-level comment, not a reply.")
        
        if reply.author != user:
            raise PermissionError("You can only delete your own replies.")
        
        reply.delete()

    @staticmethod
    def toogle_share(user, post_id, note=""):
        post = get_object_or_404(Post, id=post_id)

        shared, created = Share.objects.get_or_create(user=user, post=post, note=note)

        if not created:
            shared.delete()

        return {"shared": created, "share_count": post.shares.count()}
