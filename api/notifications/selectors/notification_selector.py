from notifications.models import Notification

class NotificationSelector:
    @staticmethod
    def get_user_notifications(user):
        
        return Notification.objects.filter(receiver = user).select_related("actor").order_by("-created_at")
    
    @staticmethod
    def get_unread_notifications(user):
        return Notification.objects.filter(receiver = user, is_read = False).select_related("actor").order_by("-created_at")
    
    @staticmethod
    def get_unread_count(user):

        return Notification.objects.filter(receiver=user,is_read=False).count()
        