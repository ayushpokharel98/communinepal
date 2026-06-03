from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Post(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts",
    )

    caption = models.TextField(
        blank=True,
        max_length=3000,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["author", "-created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.author.username} - {self.id}"

    @property
    def media_type(self):

        media = list(self.media.all())

        if not media:
            return "text"

        types = {item.media_type for item in media}

        if len(types) == 1:
            return types.pop()

        return "mixed"


def post_media_upload_path(instance, filename):
    return f"posts/{instance.post_id}/{filename}"


class PostMedia(models.Model):

    class MediaType(models.TextChoices):
        PHOTO = "photo", "Photo"
        VIDEO = "video", "Video"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="media",
    )

    file = models.FileField(
        upload_to=post_media_upload_path,
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    thumbnail = models.ImageField(
        upload_to=post_media_upload_path,
        null=True,
        blank=True,
    )

    order = models.PositiveSmallIntegerField(default=0)

    duration = models.FloatField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

        indexes = [
            models.Index(fields=["post", "order"]),
        ]

    def __str__(self):
        return f"{self.media_type} - {self.post_id}"


class Like(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="likes",
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="likes",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "post"],
                name="unique_post_like",
            )
        ]

        indexes = [
            models.Index(fields=["post", "-created_at"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.username} likes {self.post_id}"


class Comment(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
    )

    body = models.TextField(max_length=2000)

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["post", "created_at"]),
            models.Index(fields=["author"]),
            models.Index(fields=["parent"]),
        ]

    def __str__(self):
        return f"Comment by {self.author.username}"

    @property
    def is_reply(self):
        return self.parent is not None


class Share(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="shares",
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="shares",
    )

    note = models.TextField(
        blank=True,
        max_length=1000,
    )

    shared_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-shared_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "post"],
                name="unique_post_share",
            )
        ]

        indexes = [
            models.Index(fields=["post", "-shared_at"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.username} shared {self.post_id}"