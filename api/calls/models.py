import uuid
from django.db import models 
from django.conf import settings
from chat.models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()

class Call(models.Model):
    class CallType(models.TextChoices):
        AUDIO = "audio", "Audio"
        VIDEO = "video", "Video"
        
    class Status(models.TextChoices):
        RINGING = "ringing", "Ringing"
        ACTIVE = "active", "active"
        REJECTED = "rejected", "rejected"
        CANCELLED = "cancelled", "cancelled"
        MISSED = "missed", "Missed"
        ENDED = "ended", "Ended"
        FAILED = "failed", "Failed"
        
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="calls")
    
    initiated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="initiated_calls")
    
    call_type = models.CharField(choices=CallType.choices, max_length=10)
    
    status = models.CharField(choices=Status.choices, max_length=10, default=Status.RINGING)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    answered_at = models.DateTimeField(null=True, blank=True)
    
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Call by {self.initiated_by.username}"

class CallParticipant(models.Model):
    class Role(models.TextChoices):
        INITIATOR = "initiator", "Initiator"
        PARTICIPANT = "participant", "Participant"

    class Status(models.TextChoices):
        INVITED = "invited", "Invited"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        LEFT = "left", "Left"
        
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)  
    
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name="participants")
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="call_participations"
    )

    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.PARTICIPANT
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.INVITED
    )

    joined_at = models.DateTimeField(
        null=True,
        blank=True
    )

    left_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["call", "user"],
                name="unique_call_participant"
            )
        ]

        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.user} in {self.call}"