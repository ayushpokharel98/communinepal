import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    members = models.ManyToManyField(User, related_name="conversations")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class Message(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    
    content = models.TextField()
    
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="replies")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=["conversation", "created_at"])
        ]
    
    def __str__(self):
        return f"Message ({self.id}) in {self.conversation.id}"
    
class MessageSeen(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="seen")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("message", "user")
    
    def __str__(self):
        return f"{self.user.username} read {self.message.id}"
    