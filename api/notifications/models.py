from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        FRIEND_REQUEST = "friend_request"
        FRIEND_ACCEPTED = "friend_accepted"
        POST_LIKED = "post_liked"
        COMMENT = "comment"
        MENTION = "mention"
        SYSTEM = "system"
        MESSAGE = "message"
        
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    
    actor = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="triggered_notifications")
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
        indexes = [
            models.Index(fields=["receiver"]),
            models.Index(fields=["receiver", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.receiver} - {self.title}"