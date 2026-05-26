from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts"
    )
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Post by {self.author} at {self.created_at}"
    
    @property
    def media_type(self):
        types = set(self.media.values_list('media_type', flat = True))
        if not types:
            return 'text'
        if len(types)==1:
            return types.pop()
        return 'mixed'
    
def post_media_upload_path(instance, filename):
    return f"posts/{instance.post.id}/{filename}"

class PostMedia(models.Model):
    class MediaType(models.TextChoices):
        PHOTO = 'photo', 'Photo'
        VIDEO = 'video', 'Video'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to=post_media_upload_path)
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    thumbnail = models.ImageField(upload_to=post_media_upload_path, null=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    duration = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return f"{self.media_type} for post {self.post.id}"
    
class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'post')
    
    def __str__(self):
        return f"{self.user} likes {self.post.id}"
    
class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    
    parent = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.CASCADE)
    
    body = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment of {self.author} on {self.post.id}"
    
class Share(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="shares", on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="shares")
    shared_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)
    
    class Meta:
        unique_together = {'user', 'post'}
    
    def __str__(self):
        return f"{self.user} shared {self.post.id}"
    