from django.contrib.auth import get_user_model


from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import (
    Asset,
    MaintenanceSchedule,
    QRScanLog,
    MaintenanceReport
)
from .permissions import (
    IsAdmin,
    IsAdminOrOwnClient,
    IsAdminOrTechnician,
    IsMaintenanceReportAllowed
)
from .serializers import (
    MaintenanceReportSerializer,
    MaintenanceScheduleSerializer,
    UserCreateSerializer,
    UserSerializer,
    AssetSerializer,
)


from django.conf import settings
from django.http import HttpResponse

import qrcode

User = get_user_model()


class MeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTechnician]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.all().order_by("id")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer

        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class AssetListCreateView(generics.ListCreateAPIView):
    serializer_class = AssetSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdmin()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.ADMIN:
            return Asset.objects.all().order_by("-created_at")

        if user.role == User.Role.CLIENT:
            return Asset.objects.filter(
                client=user
            ).order_by("-created_at")

        return Asset.objects.none()


class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssetSerializer
    queryset = Asset.objects.all()

    def get_permissions(self):
        return [
            IsAuthenticated(),
            IsAdminOrOwnClient(),
        ]

class AssetQRCodeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk)
        except Asset.DoesNotExist:
            return Response(
                {"detail": "Asset not found."},
                status=404,
            )

        if not asset.qr_active:
            return Response(
                {"detail": "QR code is inactive."},
                status=400,
            )

        # URL encoded inside the QR code
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

        image.save(response, format="PNG")

        return response

class QRScanView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrTechnician,
    ]

    def post(self, request, token):
        try:
            asset = Asset.objects.get(qr_token=token)
        except Asset.DoesNotExist:
            QRScanLog.objects.create(
                user=request.user,
                result=QRScanLog.Result.INVALID,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            return Response(
                {"detail": "Invalid QR code."},
                status=404,
            )

        if not asset.qr_active:
            QRScanLog.objects.create(
                asset=asset,
                user=request.user,
                result=QRScanLog.Result.DENIED,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            return Response(
                {"detail": "This QR code has been revoked."},
                status=403,
            )

        # Successful scan
        QRScanLog.objects.create(
            asset=asset,
            user=request.user,
            result=QRScanLog.Result.SUCCESS,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        # Update last scan time
        from django.utils import timezone

        asset.last_qr_scan_at = timezone.now()
        asset.save(update_fields=["last_qr_scan_at"])

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

        # Prevent duplicate schedules for the same asset
        if MaintenanceSchedule.objects.filter(
            asset=asset
        ).exists():
            raise ValidationError(
                "This asset already has a maintenance schedule."
            )

        serializer.save(
            created_by=self.request.user
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

    
class MaintenanceReportListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = MaintenanceReportSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.ADMIN:
            return MaintenanceReport.objects.all().order_by(
                "-created_at"
            )

        if user.role == User.Role.TECHNICIAN:
            return MaintenanceReport.objects.filter(
                maintenance__technician=user
            ).order_by("-created_at")

        if user.role == User.Role.CLIENT:
            return MaintenanceReport.objects.filter(
                maintenance__work_order__client=user
            ).order_by("-created_at")

        return MaintenanceReport.objects.none()

    def get_permissions(self):
        if self.request.method == "POST":
            return [
                IsAuthenticated(),
                IsMaintenanceReportAllowed(),
            ]

        return [
            IsAuthenticated(),
        ]

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == User.Role.CLIENT:
            raise PermissionDenied(
                "Clients cannot create maintenance reports."
            )

        maintenance = serializer.validated_data[
            "maintenance"
        ]

        if user.role == User.Role.TECHNICIAN:
            if maintenance.technician != user:
                raise PermissionDenied(
                    "You can only create reports for your own maintenance tasks."
                )

        serializer.save()