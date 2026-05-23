from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField
from rest_framework.exceptions import ValidationError
from django.conf import settings

AUTH_PROVIDERS = [("email", "Email"), ("google", "Google")]

GENDER_CHOICES = [("m", "Male"), ("f", "Female"), ("n", "Not preferred to say")]


class CustomUser(AbstractUser):
    username = models.CharField(
        max_length=20,
        unique=True,
        error_messages={"unique": "Username already exists!"},
    )
    email = models.EmailField(
        unique=True, error_messages={"unique": "Email already exists!"}
    )
    first_name = models.CharField(max_length=20)
    last_name = models.CharField(max_length=20)
    is_verified = models.BooleanField(default=False)
    auth_provider = models.CharField(
        max_length=20, choices=AUTH_PROVIDERS, default="email"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.email


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    phone_number = PhoneNumberField(blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default="n")
    address = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(
        default="profile_picture/default.png", upload_to="profile_picture/"
    )
    cover_picture = models.ImageField(
        default="cover_picture/default.png", upload_to="cover_picture/"
    )

    def __str__(self):
        return f"{self.user.username}'s Profile"


class FriendshipStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    BLOCKED = "blocked", "Blocked"


class Friendship(models.Model):
    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )

    status = models.CharField(
        max_length=20,
        choices=FriendshipStatus.choices,
        default=FriendshipStatus.PENDING,
    )

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="requested_friendships",
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user1", "user2"],
                name="unique_friendship"
            )
        ]
    
    def clean(self):
        if(self.user1 == self.user2):
            raise ValidationError("User can't friend themselves")
        
    def other_user(self, current_user):
        return self.user2 if self.user1 == current_user else self.user1
    
    def __str__(self):
        return f"{self.user1} <-> {self.user2} ({self.status})"