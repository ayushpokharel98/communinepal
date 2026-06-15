from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationDeleteView,
    NotificationDeleteAllView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="all-notifications"),
    path("<int:pk>/mark-read/", NotificationMarkReadView.as_view(), name="mark-raed"),
    path("mark_all_as_read/", NotificationMarkAllReadView.as_view(), name="mark_all_as_read"),
    path("<int:pk>/delete/", NotificationDeleteView.as_view(), name="notification-delete"),
    path("delete_all/", NotificationDeleteAllView.as_view(), name="notification-delete-all"),
]
