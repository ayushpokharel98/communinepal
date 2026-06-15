import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.shortcuts import get_object_or_404
from notifications.serializers import NotificationSerializer
from notifications.models import Notification
from posts.services.permission_service import PermissionService

logger = logging.getLogger(__name__)


class NotificationService:

    @classmethod
    def send(cls, notification):
        serializer = NotificationSerializer(notification)
        channel_layer = get_channel_layer()

        if not channel_layer:
            logger.warning("Channel layer is not configured. Skipping WebSocket notification.")
            return

        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{notification.receiver_id}",
                {
                    "type": "send_notification",
                    "data": serializer.data,
                },
            )
        except Exception:
            logger.exception("Failed to send WebSocket notification %s", notification.id)

    @classmethod
    def _create(
        cls,
        *,
        receiver,
        actor,
        notification_type,
        title,
        message,
        data=None,
    ):
        if actor and receiver.id == actor.id:
            return None

        notification = Notification.objects.create(
            receiver=receiver,
            actor=actor,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {},
        )

        transaction.on_commit(lambda: cls.send(notification))

        return notification

    @classmethod
    def friend_request(
        cls,
        *,
        receiver,
        sender,
    ):
        return cls._create(
            receiver=receiver,
            actor=sender,
            notification_type=Notification.NotificationType.FRIEND_REQUEST,
            title="Friend Request",
            message=f"@{sender.username} sent you a friend request.",
            data={
                "username": sender.username,
            },
        )

    @classmethod
    def friend_accepted(
        cls,
        *,
        receiver,
        accepter,
    ):
        return cls._create(
            receiver=receiver,
            actor=accepter,
            notification_type=Notification.NotificationType.FRIEND_ACCEPTED,
            title="Friend Request Accepted",
            message=f"@{accepter.username} accepted your friend request.",
            data={
                "username": accepter.username,
            },
        )

    @classmethod
    def post_liked(
        cls,
        *,
        receiver,
        actor,
        post,
    ):
        return cls._create(
            receiver=receiver,
            actor=actor,
            notification_type=Notification.NotificationType.POST_LIKED,
            title="New Like",
            message=f"@{actor.username} liked your post.",
            data={
                "post_id": str(post.id),
                "actor_username":actor.username
            },
        )

    @classmethod
    def comment(
        cls,
        *,
        receiver,
        actor,
        post,
        comment,
        is_reply=False,
    ):
        return cls._create(
            receiver=receiver,
            actor=actor,
            notification_type=Notification.NotificationType.COMMENT,
            title="New Reply" if is_reply else "New Comment",
            message=(
                f"@{actor.username} replied to your comment."
                if is_reply
                else f"@{actor.username} commented on your post."
            ),
            data={
                "post_id": str(post.id),
                "comment_id": str(comment.id),
                "is_reply": is_reply,
            },
        )

    @classmethod
    def mention(
        cls,
        *,
        receiver,
        actor,
        post=None,
        comment=None,
    ):
        data = {}

        if post:
            data["post_id"] = str(post.id)

        if comment:
            data["comment_id"] = str(comment.id)

        return cls._create(
            receiver=receiver,
            actor=actor,
            notification_type=Notification.NotificationType.MENTION,
            title="Mentioned",
            message=f"{actor.username} mentioned you.",
            data=data,
        )

    @classmethod
    def message(
        cls,
        *,
        receiver,
        sender,
        conversation=None,
        message=None,
    ):
        data = {}

        if conversation:
            data["conversation_id"] = str(conversation.id)

        if message:
            data["message_id"] = str(message.id)

        return cls._create(
            receiver=receiver,
            actor=sender,
            notification_type=Notification.NotificationType.MESSAGE,
            title="New Message",
            message=f"{sender.username} sent you a message.",
            data=data,
        )

    @classmethod
    def system(
        cls,
        *,
        receiver,
        title,
        message,
        data=None,
    ):
        return cls._create(
            receiver=receiver,
            actor=None,
            notification_type=Notification.NotificationType.SYSTEM,
            title=title,
            message=message,
            data=data or {},
        )
    
    @staticmethod
    def markAsRead(notification_id, user):
        notification = get_object_or_404(Notification, id=notification_id, is_read=False)
        PermissionService.check_permission(notification, user, owner_field="receiver")
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        
        return notification
    
    @staticmethod
    def markAllAsRead(user):
        Notification.objects.filter(receiver=user, is_read=False).update(is_read=True)
    
    @staticmethod
    def deleteNotification(notification_id, user):
        notification = get_object_or_404(Notification, id=notification_id)
        PermissionService.check_permission(notification, user, owner_field="receiver")
        notification.delete()
    
    @staticmethod
    def deleteAllNotifications(user):
        Notification.objects.filter(receiver=user).delete()