import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    members = models.ManyToManyField(User, related_name="conversations")
    last_event = models.ForeignKey(
        "TimelineEvent",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation between {self.members.all()}"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )

    content = models.TextField()

    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="replies"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["conversation", "created_at"])]

    def __str__(self):
        return f"Message ({self.id}) in {self.conversation.id}"


class Call(models.Model):
    CALL_TYPES = (
        ("audio", "Audio"),
        ("video", "Video"),
    )

    STATUS = (
        ("missed", "Missed"),
        ("completed", "Completed"),
        ("declined", "Declined"),
        ("cancelled", "Cancelled"),
        ("ringing", "Ringing"),
        ("ongoing", "Ongoing"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="calls"
    )

    initiator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="initiated_calls"
    )

    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_calls"
    )

    call_type = models.CharField(max_length=10, choices=CALL_TYPES)

    status = models.CharField(max_length=20, choices=STATUS, default="ringing")

    started_at = models.DateTimeField(auto_now_add=True)

    answered_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    duration = models.PositiveIntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(
                fields=["conversation", "-started_at"]
            )
        ]
        
    def __str__(self):
        return f"{self.initiator.username} {self.status} call with {self.receiver.username}"


class MessageSeen(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="seen")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("message", "user")

    def __str__(self):
        return f"{self.user.username} read {self.message.id}"


class TimelineEvent(models.Model):
    class EventType(models.TextChoices):
        MESSAGE = "message", "Message"
        CALL = "call", "Call"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="events",
    )

    type = models.CharField(
        max_length=20,
        choices=EventType.choices,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    message = models.OneToOneField(
        "Message",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="event",
    )

    call = models.OneToOneField(
        "Call",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="event",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["conversation", "-created_at"])]

    def __str__(self):
        return f"{self.type} event ({self.id})"
