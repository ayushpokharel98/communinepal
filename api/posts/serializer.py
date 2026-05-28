from rest_framework import serializers

from .models import (
    Post,
    PostMedia,
    Comment,
)

class PostMediaSerializer(serializers.ModelSerializer):

    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia

        fields = [
            "id",
            "media_type",
            "file_url",
            "thumbnail_url",
            "order",
            "duration",
        ]

    def get_file_url(self, obj):

        if not obj.file:
            return None

        request = self.context.get("request")

        return (
            request.build_absolute_uri(obj.file.url)
            if request
            else obj.file.url
        )

    def get_thumbnail_url(self, obj):

        if not obj.thumbnail:
            return None

        request = self.context.get("request")

        return (
            request.build_absolute_uri(obj.thumbnail.url)
            if request
            else obj.thumbnail.url
        )

class CommentSerializer(serializers.ModelSerializer):

    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    author_profile_picture = serializers.SerializerMethodField()

    replies = serializers.SerializerMethodField()

    is_reply = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Comment

        fields = [
            "id",
            "post",
            "author",
            "author_username",
            "author_profile_picture",
            "parent",
            "body",
            "is_reply",
            "replies",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "author",
            "post",
            "created_at",
            "updated_at",
        ]

    def get_author_profile_picture(self, obj):

        profile_picture = getattr(
            obj.author.profile,
            "profile_picture",
            None,
        )

        if not profile_picture:
            return None

        request = self.context.get("request")

        return (
            request.build_absolute_uri(profile_picture.url)
            if request
            else profile_picture.url
        )

    def get_replies(self, obj):

        if obj.parent is not None:
            return []

        replies = obj.replies.all()

        return CommentSerializer(
            replies,
            many=True,
            context=self.context,
        ).data

class PostSerializer(serializers.ModelSerializer):

    media = PostMediaSerializer(
        many=True,
        read_only=True,
    )

    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    author_profile_picture = serializers.SerializerMethodField()

    likes_count = serializers.IntegerField(
        read_only=True,
    )

    comments_count = serializers.IntegerField(
        read_only=True,
    )

    shares_count = serializers.IntegerField(
        read_only=True,
    )

    is_liked = serializers.BooleanField(
        read_only=True,
        default=False,
    )

    is_shared = serializers.BooleanField(
        read_only=True,
        default=False,
    )

    media_type = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = Post

        fields = [
            "id",
            "author",
            "author_username",
            "author_profile_picture",
            "caption",
            "media",
            "media_type",
            "likes_count",
            "comments_count",
            "shares_count",
            "is_liked",
            "is_shared",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]

    def get_author_profile_picture(self, obj):

        profile_picture = getattr(
            obj.author.profile,
            "profile_picture",
            None,
        )

        if not profile_picture:
            return None

        request = self.context.get("request")

        return (
            request.build_absolute_uri(profile_picture.url)
            if request
            else profile_picture.url
        )


class PostDetailSerializer(PostSerializer):

    comments = CommentSerializer(
        many=True,
        read_only=True,
    )

    class Meta(PostSerializer.Meta):

        fields = PostSerializer.Meta.fields + [
            "comments",
        ]


class PostCreateSerializer(serializers.Serializer):

    caption = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=3000,
    )

    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=list,
    )

    media_types = serializers.ListField(
        child=serializers.ChoiceField(
            choices=PostMedia.MediaType.choices
        ),
        required=False,
        default=list,
    )

    def validate(self, attrs):

        files = attrs.get("uploaded_files", [])
        types = attrs.get("media_types", [])

        if len(files) != len(types):
            raise serializers.ValidationError(
                "uploaded_files and media_types length mismatch."
            )

        if len(files) > 10:
            raise serializers.ValidationError(
                "Maximum 10 media files allowed."
            )

        return attrs



class PostUpdateSerializer(serializers.Serializer):

    caption = serializers.CharField(
        required=True,
        allow_blank=True,
        max_length=3000,
    )

class CommentCreateSerializer(serializers.Serializer):

    body = serializers.CharField(
        required=True,
        max_length=2000,
    )

    parent_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
    )