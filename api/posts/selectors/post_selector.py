from ..models import Post, Comment
from users.models import Friendship
from users.services.friend_service import FriendService

class PostSelector:
    
    @staticmethod
    def get_feed(user):
        friends = FriendService.get_friends(user)
        
        friend_ids = set()
        
        for friend in friends:
            other = friend.other_user(user)
            friend_ids.add(other.id)
        
        friend_ids.add(user.id)
        
        return Post.objects.filter(author__id__in = friend_ids).prefetch_related("media", "likes", "comments", "shares").select_related("author__profile")
    
    @staticmethod
    def get_post_by_id(post_id):
        return Post.objects.prefetch_related("media", "likes", "comments", "shares").select_related("author__profile").get(id=post_id)
    
    @staticmethod
    def get_comments(post_id):
        return Comment.objects.filter(post_id = post_id, parent=None).select_related("author__profile").prefetch_related("replies__author__profile")