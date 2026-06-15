from rest_framework.exceptions import PermissionDenied
class PermissionService:
    @staticmethod
    def check_permission(obj, user, owner_field = "author"):
        if getattr(obj, f"{owner_field}_id") != user.id:
            return PermissionDenied("You don't have the permission to do this")
        