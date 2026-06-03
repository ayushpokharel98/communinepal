from rest_framework import generics
from rest_framework.views import APIView
from .serializers import NotificationSerializer
from .models import Notification
from .selectors.notification_selector import NotificationSelector
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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