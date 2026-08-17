from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

import qrcode

from .models import (
    Asset,
    Maintenance,
    MaintenanceSchedule,
    QRScanLog,
    MaintenanceReport,
    WorkOrder,
)

from .permissions import (
    IsAdmin,
    IsAdminOrOwnClient,
    IsAdminOrTechnician,
    IsMaintenanceReportAllowed,
)

from .serializers import (
    MaintenanceReportSerializer,
    MaintenanceScheduleSerializer,
    MaintenanceSerializer,
    UserCreateSerializer,
    UserSerializer,
    AssetSerializer,
    WorkOrderSerializer,
)


User = get_user_model()


# ============================================================
# CURRENT USER
# ============================================================

class MeView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrTechnician,
    ]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ============================================================
# USERS
# ADMIN ONLY
# ============================================================

class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    def get_queryset(self):
        return User.objects.all().order_by("id")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer

        return UserSerializer


class UserDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    queryset = User.objects.all()
    serializer_class = UserSerializer


# ============================================================
# ASSETS
# ============================================================

class AssetListCreateView(generics.ListCreateAPIView):
    serializer_class = AssetSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [
                IsAuthenticated(),
                IsAdmin(),
            ]

        return [
            IsAuthenticated(),
        ]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.ADMIN:
            return Asset.objects.all().order_by("-created_at")

        if user.role == User.Role.CLIENT:
            return Asset.objects.filter(
                client=user
            ).order_by("-created_at")

        # Technicians cannot see assets directly
        return Asset.objects.none()


class AssetDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = AssetSerializer
    queryset = Asset.objects.all()

    def get_permissions(self):
        return [
            IsAuthenticated(),
            IsAdminOrOwnClient(),
        ]


# ============================================================
# ASSET QR CODE
# ADMIN ONLY
# ============================================================

class AssetQRCodeView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    def get(self, request, pk):

        try:
            asset = Asset.objects.get(pk=pk)

        except Asset.DoesNotExist:
            return Response(
                {
                    "detail": "Asset not found."
                },
                status=404,
            )

        if not asset.qr_active:
            return Response(
                {
                    "detail": "QR code is inactive."
                },
                status=400,
            )

        qr_url = (
            f"{settings.ASSETHUB_BASE_URL}"
            f"/api/qr/scan/{asset.qr_token}/"
        )

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )

        qr.add_data(qr_url)
        qr.make(fit=True)

        image = qr.make_image()

        response = HttpResponse(
            content_type="image/png"
        )

        image.save(
            response,
            format="PNG",
        )

        return response


# ============================================================
# QR SCANNING
# ADMIN + TECHNICIAN
# ============================================================

class QRScanView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrTechnician,
    ]

    def post(self, request, token):

        try:
            asset = Asset.objects.get(
                qr_token=token
            )

        except Asset.DoesNotExist:

            QRScanLog.objects.create(
                user=request.user,
                result=QRScanLog.Result.INVALID,
                ip_address=request.META.get(
                    "REMOTE_ADDR"
                ),
                user_agent=request.META.get(
                    "HTTP_USER_AGENT",
                    "",
                ),
            )

            return Response(
                {
                    "detail": "Invalid QR code."
                },
                status=404,
            )

        if not asset.qr_active:

            QRScanLog.objects.create(
                asset=asset,
                user=request.user,
                result=QRScanLog.Result.DENIED,
                ip_address=request.META.get(
                    "REMOTE_ADDR"
                ),
                user_agent=request.META.get(
                    "HTTP_USER_AGENT",
                    "",
                ),
            )

            return Response(
                {
                    "detail": "This QR code has been revoked."
                },
                status=403,
            )

        # Successful scan
        QRScanLog.objects.create(
            asset=asset,
            user=request.user,
            result=QRScanLog.Result.SUCCESS,
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
            user_agent=request.META.get(
                "HTTP_USER_AGENT",
                "",
            ),
        )

        # Update last scan time
        asset.last_qr_scan_at = timezone.now()

        asset.save(
            update_fields=[
                "last_qr_scan_at"
            ]
        )

        return Response(
            {
                "message": "QR code scanned successfully.",

                "asset": {
                    "id": asset.id,
                    "name": asset.name,
                    "serial_number": asset.serial_number,
                    "description": asset.description,
                    "client": asset.client.id,
                    "client_username": asset.client.username,
                },
            },
            status=200,
        )


# ============================================================
# MAINTENANCE SCHEDULE
# ADMIN ONLY
# ============================================================

class MaintenanceScheduleListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = MaintenanceScheduleSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    def get_queryset(self):

        return MaintenanceSchedule.objects.select_related(
            "asset",
            "created_by",
        ).order_by(
            "next_maintenance_date"
        )

    def perform_create(self, serializer):

        asset = serializer.validated_data["asset"]

        # Prevent duplicate schedules
        if MaintenanceSchedule.objects.filter(
            asset=asset
        ).exists():

            raise ValidationError(
                "This asset already has a maintenance schedule."
            )

        schedule = serializer.save(
            created_by=self.request.user
        )

        # Automatically calculate first maintenance date
        schedule.next_maintenance_date = (
            schedule.calculate_next_date()
        )

        schedule.save(
            update_fields=[
                "next_maintenance_date"
            ]
        )


class MaintenanceScheduleDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = MaintenanceSchedule.objects.all()

    serializer_class = MaintenanceScheduleSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]


# ============================================================
# MAINTENANCE
# ADMIN ONLY
# ============================================================

class MaintenanceListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = MaintenanceSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [
                IsAuthenticated(),
                IsAdmin(),
            ]

        return [
            IsAuthenticated(),
            IsAdminOrTechnician(),
        ]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.ADMIN:
            return Maintenance.objects.select_related(
                "work_order",
                "technician",
                "work_order__asset",
            ).order_by("-created_at")

        if user.role == User.Role.TECHNICIAN:
            return Maintenance.objects.select_related(
                "work_order",
                "technician",
                "work_order__asset",
            ).filter(
                technician=user
            ).order_by("-created_at")

        return Maintenance.objects.none()

    def perform_create(self, serializer):

        technician = serializer.validated_data["technician"]

        if technician.role != User.Role.TECHNICIAN:
            raise ValidationError(
                "Maintenance can only be assigned to a technician."
            )

        serializer.save()

class MaintenanceDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = MaintenanceSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    queryset = Maintenance.objects.select_related(
        "work_order",
        "technician",
        "work_order__asset",
    )
# ============================================================
# MAINTENANCE REPORTS
# ADMIN + TECHNICIAN + CLIENT READ
# TECHNICIAN CREATE
# ============================================================

class MaintenanceReportListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = MaintenanceReportSerializer

    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------

    def get_queryset(self):

        user = self.request.user

        queryset = MaintenanceReport.objects.select_related(
            "maintenance",
            "maintenance__technician",
            "maintenance__work_order",
            "maintenance__work_order__client",
            "maintenance__work_order__asset",
        )

        # ADMIN
        if user.role == User.Role.ADMIN:

            return queryset.order_by(
                "-created_at"
            )

        # TECHNICIAN
        if user.role == User.Role.TECHNICIAN:

            return queryset.filter(
                maintenance__technician=user
            ).order_by(
                "-created_at"
            )

        # CLIENT
        if user.role == User.Role.CLIENT:

            return queryset.filter(
                maintenance__work_order__client=user
            ).order_by(
                "-created_at"
            )

        return MaintenanceReport.objects.none()

    # --------------------------------------------------------
    # PERMISSIONS
    # --------------------------------------------------------

    def get_permissions(self):

        if self.request.method == "POST":

            return [
                IsAuthenticated(),
                IsMaintenanceReportAllowed(),
            ]

        return [
            IsAuthenticated(),
        ]

    # --------------------------------------------------------
    # CREATE REPORT
    # --------------------------------------------------------

    def perform_create(self, serializer):

        user = self.request.user

        # Clients cannot create reports
        if user.role == User.Role.CLIENT:

            raise PermissionDenied(
                "Clients cannot create maintenance reports."
            )

        maintenance = serializer.validated_data[
            "maintenance"
        ]

        # Technician can only create reports
        # for their assigned maintenance
        if user.role == User.Role.TECHNICIAN:

            if maintenance.technician != user:

                raise PermissionDenied(
                    "You can only create reports for your own maintenance tasks."
                )

        # Prevent duplicate reports
        if MaintenanceReport.objects.filter(
            maintenance=maintenance
        ).exists():

            raise ValidationError(
                "A maintenance report already exists for this maintenance task."
            )

        report = serializer.save()

        # ----------------------------------------------------
        # AUTOMATIC MAINTENANCE COMPLETION
        # ----------------------------------------------------

        if report.status == MaintenanceReport.Status.COMPLETED:

            maintenance.status = (
                Maintenance.Status.COMPLETED
            )

            maintenance.save(
                update_fields=[
                    "status"
                ]
            )

            asset = maintenance.work_order.asset

            # Get maintenance schedule
            try:

                schedule = asset.maintenance_schedule

            except MaintenanceSchedule.DoesNotExist:

                schedule = None

            # Update schedule
            if schedule and schedule.is_active:

                today = timezone.localdate()

                schedule.last_maintenance_date = today

                schedule.next_maintenance_date = (
                    schedule.calculate_next_date(
                        today
                    )
                )

                schedule.save(
                    update_fields=[
                        "last_maintenance_date",
                        "next_maintenance_date",
                        "updated_at",
                    ]
                )

# ============================================================
# MAINTENANCE REPORT DETAIL
# ADMIN + TECHNICIAN + CLIENT
# ============================================================

class MaintenanceReportDetailView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = MaintenanceReportSerializer

    permission_classes = [
        IsAuthenticated,
        IsMaintenanceReportAllowed,
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = MaintenanceReport.objects.select_related(
            "maintenance",
            "maintenance__technician",
            "maintenance__work_order",
            "maintenance__work_order__client",
            "maintenance__work_order__asset",
        )

        # ADMIN
        if user.role == User.Role.ADMIN:
            return queryset

        # TECHNICIAN
        if user.role == User.Role.TECHNICIAN:
            return queryset.filter(
                maintenance__technician=user
            )

        # CLIENT
        if user.role == User.Role.CLIENT:
            return queryset.filter(
                maintenance__work_order__client=user
            )

        return queryset.none()
# ============================================================
# WORK ORDERS
# ADMIN + CLIENT
# ============================================================

class WorkOrderListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = WorkOrderSerializer

    def get_permissions(self):
        return [
            IsAuthenticated(),
        ]

    def get_queryset(self):
        user = self.request.user

        # Admin sees everything
        if user.role == User.Role.ADMIN:
            return WorkOrder.objects.select_related(
                "client",
                "asset",
            ).order_by("-created_at")

        # Client sees their own work orders
        if user.role == User.Role.CLIENT:
            return WorkOrder.objects.select_related(
                "client",
                "asset",
            ).filter(
                client=user
            ).order_by("-created_at")

        # Technician doesn't manage work orders
        return WorkOrder.objects.none()

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == User.Role.TECHNICIAN:
            raise PermissionDenied(
                "Technicians cannot create work orders."
            )

        serializer.save()


class WorkOrderDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = WorkOrderSerializer

    def get_queryset(self):

        user = self.request.user

        queryset = WorkOrder.objects.select_related(
            "client",
            "asset",
        )

        if user.role == User.Role.ADMIN:
            return queryset

        if user.role == User.Role.CLIENT:
            return queryset.filter(
                client=user
            )

        return queryset.none()


# ============================================================
# CLIENT MAINTENANCE REPORT REVIEW
# ============================================================

class MaintenanceReportReviewView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request, pk):

        user = request.user

        # Only clients can review reports
        if user.role != User.Role.CLIENT:
            raise PermissionDenied(
                "Only clients can review maintenance reports."
            )

        try:
            report = MaintenanceReport.objects.select_related(
                "maintenance__work_order__client",
                "maintenance__work_order__asset",
            ).get(pk=pk)

        except MaintenanceReport.DoesNotExist:
            return Response(
                {
                    "detail": "Maintenance report not found."
                },
                status=404,
            )

        # Make sure this report belongs to this client
        if report.maintenance.work_order.client != user:
            raise PermissionDenied(
                "You can only review reports belonging to your work orders."
            )

        # Report must be completed first
        if report.status != MaintenanceReport.Status.COMPLETED:
            raise ValidationError(
                "The maintenance report must be completed before it can be reviewed."
            )

        # Prevent a second review
        if (
            report.review_status
            != MaintenanceReport.ReviewStatus.PENDING
        ):
            raise ValidationError(
                "This maintenance report has already been reviewed."
            )

        action = request.data.get("action")
        comment = request.data.get(
            "comment",
            "",
        )

        # Validate action
        if action not in [
            "ACCEPT",
            "REJECT",
        ]:
            raise ValidationError(
                "Action must be ACCEPT or REJECT."
            )

        # Rejection requires a reason
        if action == "REJECT" and not comment.strip():
            raise ValidationError(
                "A comment is required when rejecting a maintenance report."
            )

        # Save decision
        if action == "ACCEPT":

            report.review_status = (
                MaintenanceReport.ReviewStatus.ACCEPTED
            )

        else:

            report.review_status = (
                MaintenanceReport.ReviewStatus.REJECTED
            )

        report.review_comment = comment
        report.reviewed_at = timezone.now()

        report.save(
            update_fields=[
                "review_status",
                "review_comment",
                "reviewed_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": (
                    "Maintenance report accepted."
                    if action == "ACCEPT"
                    else "Maintenance report rejected."
                ),
                "report_id": report.id,
                "review_status": report.review_status,
                "review_comment": report.review_comment,
                "reviewed_at": report.reviewed_at,
            },
            status=200,
        )
# ============================================================
# MAINTENANCE DETAIL
# ADMIN + TECHNICIAN
# ============================================================

class MaintenanceDetailView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = MaintenanceSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminOrTechnician,
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = Maintenance.objects.select_related(
            "work_order",
            "technician",
            "work_order__asset",
        )

        # Admin sees all maintenance
        if user.role == User.Role.ADMIN:
            return queryset

        # Technician sees only their assigned maintenance
        if user.role == User.Role.TECHNICIAN:
            return queryset.filter(
                technician=user
            )

        return queryset.none()