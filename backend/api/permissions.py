from rest_framework.permissions import BasePermission

from .models import User


class IsAdmin(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsAdminOrOwnClient(BasePermission):
    message = "You do not have permission to access this asset."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.CLIENT:
            return obj.client == request.user

        return False

class IsAdminOrTechnician(BasePermission):
    message = "Only administrators and technicians can access QR codes."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                User.Role.ADMIN,
                User.Role.TECHNICIAN,
            ]
        )