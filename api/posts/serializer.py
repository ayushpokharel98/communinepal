from rest_framework import serializers
from .models import Post, PostMedia, Like, Comment, Share
from .services.post_service import PostService

class PostMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    class Meta:
        model = PostMedia
        fields = ["id", "media_type", "file_url", "thumbnail_url", "order", "duration"]
    
    def get_file_url(self, obj):
        request = self.context.get("request")
        
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get("request")   
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        
        return None
    
class PostSerializer(serializers.ModelSerializer):
    media = PostMediaSerializer(many=True, read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_profile_picture = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    shares_count = serializers.IntegerField(source="shares.count", read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    media_type = serializers.CharField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            "id", "author", "author_username", "author_profile_picture",
            "caption", "media", "media_type",
            "likes_count", "comments_count", "shares_count",
            "is_liked", "is_shared",
            "created_at", "updated_at",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]

    def get_author_profile_picture(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.author.profile.profile_picture.url)
    
    def get_is_liked(self, obj):
        request = self.context.get("request")
        
        if request and request.user.is_authenticated:
            return obj.likes.filter(user = request.user).exists()
        
        return False
    
    def get_is_shared(self, obj):
        request = self.context.get("request")
        
        if request and request.user.is_authenticated:
            return obj.shares.filter(user = request.user).exists()
        
        return False

class PostCreateSerializer(serializers.Serializer):
    caption = serializers.CharField(required=False, default="")
    uploaded_files = serializers.ListField(
        child=serializers.FileField(), required=False, default = list
    )
    media_types = serializers.ListField(
        child = serializers.ChoiceField(choices=["photo", "video"]), required = False, default = list
    )
    
    def validate(self, attrs):
        files = attrs.get("uploaded_files", [])
        types = attrs.get("media_types", [])
        
        if(len(files) != len(types)):
            raise serializers.ValidationError("Length error")
        
        return attrs
    
    def create(self, validated_data):
        return PostService.create_post(**validated_data)

class PostUpdateSerializer(serializers.Serializer):
    caption = serializers.CharField(required=False, default="")

class CommentSerializer(serializers.Serializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_profile_picture = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            "id", "post", "author", "author_username", "author_avatar",
            "parent", "body", "created_at", "updated_at", "replies",
        ]
        read_only_fields = ["author", "post", "created_at", "updated_at"]
        
    def get_author_profile_picture(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.author.profile.profile_picture.url)
    
    def get_replies(self, obj):
        if obj.parent is None:
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []
    
class CommentCreateSerializer(serializers.Serializer):
    body = serializers.CharField()
    parent_id = serializers.UUIDField(required=False, allow_null = True, default=None)