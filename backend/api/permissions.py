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

class IsMaintenanceReportAllowed(BasePermission):

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.role in [
            User.Role.ADMIN,
            User.Role.TECHNICIAN,
            User.Role.CLIENT,
        ]

    def has_object_permission(self, request, view, obj):

        user = request.user

        # Admin can access everything
        if user.role == User.Role.ADMIN:
            return True

        maintenance = obj.maintenance
        work_order = maintenance.work_order

        # Technician can access reports for their maintenance
        if user.role == User.Role.TECHNICIAN:
            return maintenance.technician == user

        # Client can only see reports for their own assets
        if user.role == User.Role.CLIENT:
            return work_order.client == user

        return False

class IsAdminOrOwnCompany(BasePermission):
    message = "You do not have permission to access this company's asset."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True

        if request.user.role == User.Role.CLIENT:
            return (
                obj.company_id is not None
                and request.user.company_id == obj.company_id
            )

        return False

class IsAdminOrAssignedTechnician(BasePermission):
    message = "You do not have permission to access this maintenance task."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                User.Role.ADMIN,
                User.Role.TECHNICIAN,
            ]
        )

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == User.Role.ADMIN:
            return True

        # Technician can only access maintenance
        # assigned to them
        if request.user.role == User.Role.TECHNICIAN:
            return obj.technician == request.user

        return False