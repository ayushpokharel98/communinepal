from rest_framework import generics
from rest_framework.views import APIView
from .serializers import NotificationSerializer
from .models import Notification
from .selectors.notification_selector import NotificationSelector
from notifications.services.notification_service import NotificationService
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_204_NO_CONTENT

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        notifications = Notification.objects.filter(
            receiver=request.user
        )

        serializer = NotificationSerializer(
            notifications,
            many=True,
            context={"request": request}
        )

        return Response({
            "unread_count": notifications.filter(is_read=False).count(),
            "notifications": serializer.data
        })

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        NotificationService.markAsRead(pk, self.request.user)
        return Response({"detail": "Mark Read Done!"}, HTTP_200_OK)

class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        NotificationService.markAllAsRead(self.request.user)
        return Response({"detail": "All marked read"}, status=HTTP_200_OK)
    
class NotificationDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        NotificationService.deleteNotification(notification_id=pk, user=self.request.user)
        return Response({"detail": "Notification deleted successfully!"}, HTTP_204_NO_CONTENT)
    
class NotificationDeleteAllView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        NotificationService.deleteAllNotifications(self.request.user)
        return Response({"detail":"All notifications deleted"}, status=HTTP_204_NO_CONTENT)