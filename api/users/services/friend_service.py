from rest_framework.exceptions import ValidationError
from ..models import Friendship, FriendshipStatus
from django.db.models import Q


def normalize_users(user_a, user_b):
    return (user_a, user_b) if user_a.id < user_b.id else (user_b, user_a)


class FriendService:

    @staticmethod
    def send_request(sender, receiver):

        if sender == receiver:
            raise ValidationError("Cannot friend yourself")

        user1, user2 = normalize_users(sender, receiver)

        friendship = Friendship.objects.filter(user1=user1, user2=user2).first()

        if friendship:
            if friendship.status == FriendshipStatus.ACCEPTED:
                raise ValidationError("Already friends")

            if friendship.status == FriendshipStatus.PENDING:
                raise ValidationError("Friend request already sent")

        friendship = Friendship.objects.create(
            user1=user1,
            user2=user2,
            requested_by=sender,
            status=FriendshipStatus.PENDING,
        )

        return friendship

    @staticmethod
    def accept_request(friendship_id, user):
        friendship = Friendship.objects.get(id=friendship_id)

        if not friendship:
            raise ValidationError("Friendship doesn't exist")

        if friendship.status != FriendshipStatus.PENDING:
            raise ValidationError("Invalid friendship state")

        if user not in [friendship.user1, friendship.user2]:
            raise ValidationError("Not part of this friendship")

        if friendship.requested_by == user:
            raise ValidationError("Can't accept your own request")

        friendship.status = FriendshipStatus.ACCEPTED
        friendship.save(update_fields=["status"])

        return friendship

    @staticmethod
    def reject_request(friendship_id, user):
        friendship = Friendship.objects.get(id=friendship_id)

        if not friendship:
            raise ValidationError("Frienship doesn't exists")

        if user not in [friendship.user1, friendship.user2]:
            raise ValidationError("Not part of this friendship")

        if friendship.status != FriendshipStatus.PENDING:
            raise ValidationError("Invalid frienship state")

        if friendship.requested_by == user:
            raise ValidationError("Cannot reject your own request")

        friendship.delete()

    @staticmethod
    def remove_friend(friendship_id, user):
        friendship = Friendship.objects.get(id=friendship_id)

        if not friendship:
            raise ValidationError("Friendship does not exist")

        if friendship.status != FriendshipStatus.ACCEPTED:
            raise ValidationError("Users are not friends")

        if user not in [friendship.user1, friendship.user2]:
            raise ValidationError("Not part of this friendship")

        friendship.delete()

    @staticmethod
    def cancel_request(friendship_id, user):

        friendship = Friendship.objects.filter(
            id=friendship_id
        ).first()

        if not friendship:
            raise ValidationError("Friendship does not exist")

        if friendship.status != FriendshipStatus.PENDING:
            raise ValidationError("Invalid friendship state")

        if friendship.requested_by != user:
            raise ValidationError("You did not send this request")

        friendship.delete()

    @staticmethod
    def get_friends(user):

        return Friendship.objects.filter(
            Q(user1=user) | Q(user2=user), status=FriendshipStatus.ACCEPTED
        )

    @staticmethod
    def get_pending_requests(user):
        return (
            Friendship.objects.filter(status=FriendshipStatus.PENDING)
            .exclude(requested_by=user)
            .filter(Q(user1=user) | Q(user2=user))
        )

    @staticmethod
    def get_sent_requests(user):
        return Friendship.objects.filter(
            requested_by=user, status=FriendshipStatus.PENDING
        )

    @staticmethod
    def are_friends(user_a, user_b):
        user1, user2 = normalize_users(user_a, user_b)

        return Friendship.objects.filter(
            user1=user1, user2=user2, status=FriendshipStatus.ACCEPTED
        ).exists()
    
    @staticmethod
    def request_pending(user_a, user_b):
        user1, user2 = normalize_users(user_a, user_b)
        
        return Friendship.objects.filter(
            user1=user1, user2=user2, status = FriendshipStatus.PENDING
        ).exists()
