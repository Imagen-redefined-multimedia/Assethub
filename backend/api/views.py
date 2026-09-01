from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiResponse,
)

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone

from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.response import Response

import qrcode

from .models import (
    Asset,
    Company,
    Maintenance,
    MaintenanceSchedule,
    QRScanLog,
    MaintenanceReport,
    MaintenanceReportPhoto,
    WorkOrder,
)

from .permissions import (
    IsAdmin,
    IsAdminOrOwnCompany,
    IsAdminOrTechnician,
    IsMaintenanceReportAllowed,
)

from .serializers import (
    ChangePasswordSerializer,
    CompanySerializer,
    MaintenanceReassignSerializer,
    MaintenanceReportPhotoUploadSerializer,
    MaintenanceReportReviewSerializer,
    MaintenanceReportSerializer,
    MaintenanceScheduleSerializer,
    MaintenanceSerializer,
    ProfileSerializer,
    UserCreateSerializer,
    UserSerializer,
    AssetSerializer,
    WorkOrderResponseSerializer,
    WorkOrderSerializer,
)


User = get_user_model()


@extend_schema_view(
    get=extend_schema(
        tags=["Profile"],
        summary="Get current user profile",
        description="Returns the profile of the currently authenticated user.",
    ),
    put=extend_schema(
        tags=["Profile"],
        summary="Update current user profile",
    ),
    patch=extend_schema(
        tags=["Profile"],
        summary="Partially update current user profile",
    ),
)
class ProfileView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = ProfileSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_object(self):
        return self.request.user



@extend_schema_view(
    get=extend_schema(
        tags=["Companies"],
        summary="List companies",
        description="Returns all companies ordered alphabetically by name.",
    ),
    post=extend_schema(
        tags=["Companies"],
        summary="Create company",
    ),
)
class CompanyListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = CompanySerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    def get_queryset(self):
        return Company.objects.all().order_by("name")


@extend_schema_view(
    get=extend_schema(
        tags=["Companies"],
        summary="Get company",
    ),
    put=extend_schema(
        tags=["Companies"],
        summary="Update company",
    ),
    patch=extend_schema(
        tags=["Companies"],
        summary="Partially update company",
    ),
    delete=extend_schema(
        tags=["Companies"],
        summary="Delete company",
    ),
)
class CompanyDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = CompanySerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    queryset = Company.objects.all()
# ============================================================
# CURRENT USER
# ============================================================
@extend_schema(
    tags=["Profile"],
    summary="Get current authenticated user",
    description="Returns information about the currently authenticated user.",
    responses={
        200: UserSerializer,
    },
)
class MeView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# ============================================================
# USERS
# ADMIN ONLY
# ============================================================

@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="List users",
        description="Admin only. Returns all users.",
    ),
    post=extend_schema(
        tags=["Users"],
        summary="Create user",
        description="Admin only. Creates a new user and assigns their role.",
    ),
)
class UserListCreateView(
    generics.ListCreateAPIView
):

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


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="Get user",
    ),
    put=extend_schema(
        tags=["Users"],
        summary="Update user",
    ),
    patch=extend_schema(
        tags=["Users"],
        summary="Partially update user",
    ),
    delete=extend_schema(
        tags=["Users"],
        summary="Delete user",
    ),
)
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
@extend_schema_view(
    get=extend_schema(
        tags=["Assets"],
        summary="List assets",
        description=(
            "Admin sees all assets. "
            "Clients and technicians see assets belonging to their company."
        ),
    ),
    post=extend_schema(
        tags=["Assets"],
        summary="Create asset",
        description=(
            "Admin only. Creates an asset and automatically "
            "associates it with the selected client's company."
        ),
)
)
class AssetListCreateView(
    generics.ListCreateAPIView
):

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

            return Asset.objects.select_related(
                "company",
                "client",
            ).all().order_by("-created_at")

        if user.role == User.Role.CLIENT:

            return Asset.objects.select_related(
                "company",
                "client",
            ).filter(
                company=user.company
            ).order_by("-created_at")

        if user.role == User.Role.TECHNICIAN:

            return Asset.objects.select_related(
                "company",
                "client",
            ).filter(
                company=user.company
            ).order_by("-created_at")

        return Asset.objects.none()

    def perform_create(self, serializer):

        client = serializer.validated_data["client"]

        if client.role != User.Role.CLIENT:
            raise ValidationError(
                "Asset can only be assigned to a client."
            )

        if not client.company:
            raise ValidationError(
                "This client is not associated with a company."
            )

        serializer.save(
            company=client.company
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Assets"],
        summary="Get asset",
    ),
    put=extend_schema(
        tags=["Assets"],
        summary="Update asset",
    ),
    patch=extend_schema(
        tags=["Assets"],
        summary="Partially update asset",
    ),
    delete=extend_schema(
        tags=["Assets"],
        summary="Delete asset",
    ),
)
class AssetDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = AssetSerializer

    queryset = Asset.objects.select_related(
        "company",
        "client",
    )

    def get_permissions(self):

        return [
            IsAuthenticated(),
            IsAdminOrOwnCompany(),
        ]

# ============================================================
# ASSET QR CODE
# ADMIN ONLY
# ============================================================
@extend_schema(
    tags=["QR Codes"],
    summary="Generate asset QR code",
    description=(
        "Admin only. Generates and returns the PNG QR code "
        "associated with an asset."
    ),
    parameters=[
        OpenApiParameter(
            name="pk",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            required=True,
            description="Asset ID",
        ),
    ],
    responses={
        200: OpenApiResponse(
            response=OpenApiTypes.BINARY,
            description="PNG QR code image.",
        ),
        400: OpenApiResponse(
            description="QR code is inactive.",
        ),
        404: OpenApiResponse(
            description="Asset not found.",
        ),
    },
)
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
            f"{settings.ASSETHUB_FRONTEND_URL}"
            f"/assets/qr-scanner/{asset.qr_token}"
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
# ============================================================
# QR SCANNING
# ADMIN + TECHNICIAN
# ============================================================

# ============================================================
# QR SCANNING
# ADMIN + TECHNICIAN
# ============================================================

class QRScanView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrTechnician,
    ]

    @extend_schema(
        summary="Scan an asset QR code",
        description=(
            "Scans an asset QR token. The authenticated user must be "
            "an Admin or Technician. A successful scan returns the "
            "asset information and the latest active maintenance "
            "assignment for the authenticated technician."
        ),
        parameters=[
            OpenApiParameter(
                name="token",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                required=True,
                description="The asset QR token.",
            ),
        ],
        request=None,
        responses={
            200: OpenApiResponse(
                description="QR code scanned successfully.",
            ),
            403: OpenApiResponse(
                description="QR code has been revoked.",
            ),
            404: OpenApiResponse(
                description="Invalid QR code.",
            ),
        },
        tags=["QR Code"],
    )
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

        maintenance = (
            Maintenance.objects
            .select_related(
                "technician",
                "work_order",
                "work_order__client",
                "work_order__client__company",
                "work_order__asset",
            )
            .filter(
                work_order__asset=asset,
                technician=request.user,
            )
            .exclude(
                status=Maintenance.Status.COMPLETED
            )
            .order_by("-created_at")
            .first()
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
                    "qr_active": asset.qr_active,
                    "qr_created_at": asset.qr_created_at,
                    "qr_revoked_at": asset.qr_revoked_at,
                    "last_qr_scan_at": asset.last_qr_scan_at,
                    "company_name": (
                        asset.company.name
                        if asset.company
                        else None
                    ),
                },
                "maintenance": (
                    {
                        "id": maintenance.id,
                        "status": maintenance.status,
                        "description": maintenance.description,
                        "technician": maintenance.technician.id,
                        "technician_username": (
                            maintenance.technician.username
                        ),
                        "work_order": maintenance.work_order.id,
                        "work_order_title": (
                            maintenance.work_order.title
                        ),
                        "work_order_description": (
                            maintenance.work_order.description
                        ),
                        "work_order_status": (
                            maintenance.work_order.status
                        ),
                        "client_id": (
                            maintenance.work_order.client.id
                        ),
                        "client_username": (
                            maintenance.work_order.client.username
                        ),
                        "company_id": (
                            maintenance.work_order.client.company.id
                            if maintenance.work_order.client.company
                            else None
                        ),
                        "company_name": (
                            maintenance.work_order.client.company.name
                            if maintenance.work_order.client.company
                            else None
                        ),
                    }
                    if maintenance
                    else None
                ),
            },
            status=200,
        )
        
# ============================================================
# MAINTENANCE SCHEDULE
# ADMIN ONLY
# ============================================================

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance Schedules"],
        summary="List maintenance schedules",
    ),
    post=extend_schema(
        tags=["Maintenance Schedules"],
        summary="Create maintenance schedule",
        description=(
            "Admin only. Creates a maintenance schedule "
            "and automatically calculates the first maintenance date."
        ),
    ),
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

        if MaintenanceSchedule.objects.filter(
            asset=asset
        ).exists():

            raise ValidationError(
                "This asset already has a maintenance schedule."
            )

        schedule = serializer.save(
            created_by=self.request.user
        )

        schedule.next_maintenance_date = (
            schedule.calculate_next_date()
        )

        schedule.save(
            update_fields=[
                "next_maintenance_date"
            ]
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance Schedules"],
        summary="Get maintenance schedule",
    ),
    put=extend_schema(
        tags=["Maintenance Schedules"],
        summary="Update maintenance schedule",
    ),
    patch=extend_schema(
        tags=["Maintenance Schedules"],
        summary="Partially update maintenance schedule",
    ),
    delete=extend_schema(
        tags=["Maintenance Schedules"],
        summary="Delete maintenance schedule",
    ),
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

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance"],
        summary="List maintenance tasks",
        description=(
            "Admin sees all maintenance tasks. "
            "Technicians see only their assigned maintenance."
        ),
    ),
    post=extend_schema(
        tags=["Maintenance"],
        summary="Create maintenance task",
        description="Admin only. Assigns maintenance to a technician.",
    ),
)
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
                "work_order__client",
                "work_order__client__company",
                "work_order__asset",
            ).order_by("-created_at")

        if user.role == User.Role.TECHNICIAN:
            return Maintenance.objects.select_related(
                "work_order",
                "technician",
                "work_order__client",
                "work_order__client__company",
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

# ============================================================
# MAINTENANCE REPORTS
# ADMIN + TECHNICIAN + CLIENT READ
# TECHNICIAN CREATE
# ============================================================

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance Reports"],
        summary="List maintenance reports",
        description=(
            "Admin sees all reports. "
            "Technicians see reports for their assigned maintenance. "
            "Clients see reports associated with their work orders."
        ),
    ),
    post=extend_schema(
        tags=["Maintenance Reports"],
        summary="Create maintenance report",
        description=(
            "Technicians can create reports for their assigned "
            "maintenance tasks."
        ),
    ),
)
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

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance Reports"],
        summary="Get maintenance report",
    ),
    put=extend_schema(
        tags=["Maintenance Reports"],
        summary="Update maintenance report",
    ),
    patch=extend_schema(
        tags=["Maintenance Reports"],
        summary="Partially update maintenance report",
    ),
)

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

@extend_schema_view(
    get=extend_schema(
        tags=["Work Orders"],
        summary="List work orders",
        description=(
            "Admin sees all work orders. "
            "Clients see their own work orders. "
            "Technicians do not manage work orders."
        ),
    ),
    post=extend_schema(
        tags=["Work Orders"],
        summary="Create work order",
        description=(
            "Admin or client can create a work order "
            "according to their role."
        ),
    ),
)
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

        if user.role == User.Role.CLIENT:

            if not user.company:
                raise ValidationError(
                    "Your account is not attached to a company."
                )

            serializer.save(
                client=user,
                company=user.company,
            )

            return

        if user.role == User.Role.ADMIN:

            client = serializer.validated_data["client"]

            if not client.company:
                raise ValidationError(
                    "This client is not attached to a company."
                )

            serializer.save(
                company=client.company,
            )


@extend_schema_view(
    get=extend_schema(
        tags=["Work Orders"],
        summary="Get work order",
    ),
    put=extend_schema(
        tags=["Work Orders"],
        summary="Update work order",
    ),
    patch=extend_schema(
        tags=["Work Orders"],
        summary="Partially update work order",
    ),
    delete=extend_schema(
        tags=["Work Orders"],
        summary="Delete work order",
    ),
)
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

@extend_schema_view(
    post=extend_schema(
        tags=["Maintenance Reports"],
        summary="Accept or reject maintenance report",
        description=(
            "Allows a client to accept or reject a completed "
            "maintenance report."
        ),
        request=MaintenanceReportReviewSerializer,
        responses={
            200: OpenApiResponse(
                description="Maintenance report review processed successfully.",
            ),
            400: OpenApiResponse(
                description="Invalid review or report cannot be reviewed.",
            ),
            403: OpenApiResponse(
                description="User is not allowed to review this report.",
            ),
            404: OpenApiResponse(
                description="Maintenance report not found.",
            ),
        },
    ),
)
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
                "maintenance",
                "maintenance__technician",
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
        comment = request.data.get("comment", "")

        # Validate action
        if action not in ["ACCEPT", "REJECT"]:
            raise ValidationError(
                "Action must be ACCEPT or REJECT."
            )

        # Rejection requires a reason
        if action == "REJECT" and not comment.strip():
            raise ValidationError(
                "A comment is required when rejecting a maintenance report."
            )

        # Get the maintenance task
        maintenance = report.maintenance

        # ----------------------------------------------------
        # ACCEPT
        # ----------------------------------------------------

        if action == "ACCEPT":

            report.review_status = (
                MaintenanceReport.ReviewStatus.ACCEPTED
            )

            report.requires_admin_action = False

            message = "Maintenance report accepted."

        # ----------------------------------------------------
        # REJECT
        # ----------------------------------------------------

        else:

            report.review_status = (
                MaintenanceReport.ReviewStatus.REJECTED
            )

            report.requires_admin_action = True

            # Send maintenance back to Admin
            # for reassignment
            maintenance.status = Maintenance.Status.ASSIGNED

            maintenance.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            message = "Maintenance report rejected. Admin action is required."

        # ----------------------------------------------------
        # SAVE REVIEW
        # ----------------------------------------------------

        report.review_comment = comment
        report.reviewed_at = timezone.now()

        report.save(
            update_fields=[
                "review_status",
                "review_comment",
                "reviewed_at",
                "requires_admin_action",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": message,
                "report_id": report.id,
                "review_status": report.review_status,
                "review_comment": report.review_comment,
                "requires_admin_action": report.requires_admin_action,
                "reviewed_at": report.reviewed_at,
            },
            status=200,
        )

# ============================================================
# ADMIN - REJECTED MAINTENANCE REPORTS
# ============================================================

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance Reports"],
        summary="List rejected maintenance reports",
        description=(
            "Admin only. Returns maintenance reports that were "
            "rejected by clients and require administrative action."
        ),
    ),
)
class RejectedMaintenanceReportListView(
    generics.ListAPIView
):
    serializer_class = MaintenanceReportSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]

    def get_queryset(self):

        return MaintenanceReport.objects.select_related(
            "maintenance",
            "maintenance__technician",
            "maintenance__work_order",
            "maintenance__work_order__client",
            "maintenance__work_order__asset",
        ).filter(
            review_status=MaintenanceReport.ReviewStatus.REJECTED,
            requires_admin_action=True,
        ).order_by(
            "-reviewed_at"
        )
# ============================================================
# MAINTENANCE DETAIL
# ADMIN + TECHNICIAN
# ============================================================

@extend_schema_view(
    get=extend_schema(
        tags=["Maintenance"],
        summary="Get maintenance task",
    ),
    put=extend_schema(
        tags=["Maintenance"],
        summary="Update maintenance task",
    ),
    patch=extend_schema(
        tags=["Maintenance"],
        summary="Partially update maintenance task",
    ),
)
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
            "work_order__client",
            "work_order__client__company",
            "work_order__asset",
        )

        # Admin sees all maintenance
        if user.role == User.Role.ADMIN:
            return queryset

        # Technician sees only assigned maintenance
        if user.role == User.Role.TECHNICIAN:
            return queryset.filter(
                technician=user
            )

        return queryset.none()

    def update(self, request, *args, **kwargs):

        maintenance = self.get_object()

        new_status = request.data.get("status")

        # ------------------------------------------------
        # PREVENT DIRECT COMPLETION
        # ------------------------------------------------

        if new_status == Maintenance.Status.COMPLETED:

            report_exists = MaintenanceReport.objects.filter(
                maintenance=maintenance,
                status=MaintenanceReport.Status.COMPLETED,
            ).exists()

            if not report_exists:

                raise ValidationError(
                    "Maintenance cannot be completed until a completed maintenance report has been submitted."
                )

        return super().update(
            request,
            *args,
            **kwargs
        )
    
# ============================================================
# ADMIN - REASSIGN MAINTENANCE
# ============================================================

@extend_schema_view(
    post=extend_schema(
        tags=["Maintenance"],
        summary="Reassign rejected maintenance",
        description=(
            "Admin only. Reassigns a rejected maintenance report "
            "to another technician."
        ),
        request=MaintenanceReassignSerializer,
        responses={
            200: OpenApiResponse(
                description="Maintenance reassigned successfully.",
            ),
            400: OpenApiResponse(
                description="Invalid reassignment request.",
            ),
            404: OpenApiResponse(
                description="Maintenance report not found.",
            ),
        },
    ),
)
class MaintenanceReassignView(APIView):


   

    permission_classes = [
        IsAuthenticated,
        IsAdmin,
    ]
 
    def post(self, request, pk):

        try:
            report = MaintenanceReport.objects.select_related(
                "maintenance",
                "maintenance__work_order",
                "maintenance__work_order__asset",
            ).get(pk=pk)

        except MaintenanceReport.DoesNotExist:
            return Response(
                {
                    "detail": "Maintenance report not found."
                },
                status=404,
            )

        # Make sure this report was actually rejected
        if (
            report.review_status
            != MaintenanceReport.ReviewStatus.REJECTED
        ):
            raise ValidationError(
                "Only rejected maintenance reports can be reassigned."
            )

        technician_id = request.data.get("technician")

        if not technician_id:
            raise ValidationError(
                "technician is required."
            )

        try:
            technician = User.objects.get(
                pk=technician_id,
                role=User.Role.TECHNICIAN,
            )

        except User.DoesNotExist:
            raise ValidationError(
                "The selected technician does not exist."
            )

        maintenance = report.maintenance

        # Assign technician
        maintenance.technician = technician

        # Put task back into active workflow
        maintenance.status = Maintenance.Status.ASSIGNED

        maintenance.save(
            update_fields=[
                "technician",
                "status",
                "updated_at",
            ]
        )

        # Reset report for another review cycle
        report.review_status = (
            MaintenanceReport.ReviewStatus.PENDING
        )

        report.requires_admin_action = False

        report.reviewed_at = None
        report.review_comment = ""

        report.reassignment_count += 1

        report.save(
            update_fields=[
                "review_status",
                "requires_admin_action",
                "reviewed_at",
                "review_comment",
                "reassignment_count",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Maintenance reassigned successfully.",
                "report_id": report.id,
                "maintenance_id": maintenance.id,
                "technician": technician.id,
                "technician_username": technician.username,
                "status": maintenance.status,
                "reassignment_count": report.reassignment_count,
            },
            status=200,
        )


    # ============================================================
# MAINTENANCE REPORT PHOTOS
# ADMIN + ASSIGNED TECHNICIAN
# ============================================================

@extend_schema_view(
    post=extend_schema(
        tags=["Maintenance Reports"],
        summary="Upload maintenance report photo",
        description=(
            "Admin or the assigned technician can upload an image "
            "to a maintenance report."
        ),
        request=MaintenanceReportPhotoUploadSerializer,
        responses={
            201: OpenApiResponse(
                description="Maintenance report photo uploaded successfully.",
            ),
            400: OpenApiResponse(
                description="Image or photo type is invalid.",
            ),
            403: OpenApiResponse(
                description="User is not allowed to upload this photo.",
            ),
            404: OpenApiResponse(
                description="Maintenance report not found.",
            ),
        },
    ),
)
class MaintenanceReportPhotoUploadView(
    APIView
):


    permission_classes = [
        IsAuthenticated,
    ]


    
    def post(self, request, pk):

        user = request.user

        # ----------------------------------------------------
        # FIND REPORT
        # ----------------------------------------------------

        try:
            report = MaintenanceReport.objects.select_related(
                "maintenance",
                "maintenance__technician",
                "maintenance__work_order",
                "maintenance__work_order__client",
            ).get(pk=pk)

        except MaintenanceReport.DoesNotExist:

            return Response(
                {
                    "detail": "Maintenance report not found."
                },
                status=404,
            )

        maintenance = report.maintenance

        # ----------------------------------------------------
        # PERMISSION CHECK
        # ----------------------------------------------------

        if user.role == User.Role.CLIENT:

            raise PermissionDenied(
                "Clients cannot upload maintenance photos."
            )

        if user.role == User.Role.TECHNICIAN:

            if maintenance.technician != user:

                raise PermissionDenied(
                    "You can only upload photos to your assigned maintenance report."
                )

        # ----------------------------------------------------
        # ACCEPTED REPORTS ARE LOCKED
        # ----------------------------------------------------

        if (
            report.review_status
            == MaintenanceReport.ReviewStatus.ACCEPTED
        ):

            raise ValidationError(
                "This maintenance report has already been accepted and cannot be modified."
            )

        # ----------------------------------------------------
        # IMAGE REQUIRED
        # ----------------------------------------------------

        image = request.FILES.get("image")

        if not image:

            raise ValidationError(
                "An image is required."
            )

        # ----------------------------------------------------
        # PHOTO TYPE
        # ----------------------------------------------------

        photo_type = request.data.get(
            "photo_type"
        )

        if photo_type not in [
            MaintenanceReportPhoto.PhotoType.ISSUE,
            MaintenanceReportPhoto.PhotoType.FIXED,
        ]:

            raise ValidationError(
                "photo_type must be ISSUE or FIXED."
            )

        # ----------------------------------------------------
        # CREATE PHOTO
        # ----------------------------------------------------

        photo = MaintenanceReportPhoto.objects.create(
            report=report,
            image=image,
            photo_type=photo_type,
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return Response(
            {
                "message": "Maintenance report photo uploaded successfully.",
                "photo": {
                    "id": photo.id,
                    "report_id": report.id,
                    "image": photo.image.url,
                    "photo_type": photo.photo_type,
                    "uploaded_at": photo.uploaded_at,
                },
            },
            status=201,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Authentication"],
        summary="Change password",
        description="Changes the password of the currently authenticated user.",
        request=ChangePasswordSerializer,
        responses={
            200: OpenApiResponse(
                description="Password changed successfully.",
            ),
            400: OpenApiResponse(
                description="Invalid password data.",
            ),
        },
    ),
)
class ChangePasswordView(
    generics.GenericAPIView
):

    permission_classes = [
        IsAuthenticated,
    ]

    serializer_class = ChangePasswordSerializer

    def post(self, request):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "detail": "Password changed successfully."
            },
            status=status.HTTP_200_OK
        )

# ============================================================
# CLIENT - ACCEPT / REJECT WORK ORDER
# ============================================================

@extend_schema_view(
    post=extend_schema(
        tags=["Work Orders"],
        summary="Accept or reject work order",
        description=(
            "Allows a client to accept or reject a work order."
        ),
        request=WorkOrderResponseSerializer,
        responses={
            200: OpenApiResponse(
                description="Work order response processed successfully.",
            ),
            400: OpenApiResponse(
                description="Work order cannot receive another response.",
            ),
            403: OpenApiResponse(
                description="Only clients can respond to work orders.",
            ),
            404: OpenApiResponse(
                description="Work order not found.",
            ),
        },
    ),
)
class WorkOrderResponseView(APIView):

    permission_classes = [IsAuthenticated]

   
    def post(self, request, pk):

        # =====================================================
        # CLIENT ONLY
        # =====================================================

        user = request.user

        if user.role != User.Role.CLIENT:
            raise PermissionDenied(
                "Only clients can accept or reject work orders."
            )

        # =====================================================
        # FIND WORK ORDER
        # =====================================================

        try:
            work_order = (
                WorkOrder.objects
                .select_related(
                    "client",
                    "company",
                    "asset",
                )
                .get(pk=pk)
            )

        except WorkOrder.DoesNotExist:
            return Response(
                {
                    "detail": "Work order not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # =====================================================
        # OWNERSHIP CHECK
        # =====================================================

        if work_order.client_id != user.id:
            raise PermissionDenied(
                "You can only respond to your own work orders."
            )

        # =====================================================
        # VALIDATE REQUEST
        # =====================================================

        serializer = WorkOrderResponseSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        action = serializer.validated_data["action"]

        comment = serializer.validated_data.get(
            "comment",
            "",
        ).strip()

        # =====================================================
        # ONLY PENDING RESPONSES CAN BE ANSWERED
        # =====================================================

        if (
            work_order.client_response
            != WorkOrder.ClientResponse.PENDING
        ):
            raise ValidationError(
                {
                    "detail": (
                        "This work order has already "
                        "received a client response."
                    )
                }
            )

        # =====================================================
        # ACCEPT
        # =====================================================

        if action == "ACCEPT":

            work_order.client_response = (
                WorkOrder.ClientResponse.ACCEPTED
            )

            message = (
                "Work order accepted successfully."
            )

        # =====================================================
        # REJECT
        # =====================================================

        elif action == "REJECT":

            if not comment:
                raise ValidationError(
                    {
                        "comment": (
                            "A comment is required "
                            "when rejecting a work order."
                        )
                    }
                )

            work_order.client_response = (
                WorkOrder.ClientResponse.REJECTED
            )

            message = (
                "Work order rejected successfully."
            )

        # =====================================================
        # SAVE RESPONSE
        # =====================================================

        work_order.client_response_comment = comment

        work_order.client_responded_at = timezone.now()

        work_order.save(
            update_fields=[
                "client_response",
                "client_response_comment",
                "client_responded_at",
                "updated_at",
            ]
        )

        # =====================================================
        # RESPONSE
        # =====================================================

        return Response(
            {
                "message": message,
                "work_order": {
                    "id": work_order.id,
                    "title": work_order.title,
                    "status": work_order.status,
                    "client_response": (
                        work_order.client_response
                    ),
                    "client_response_comment": (
                        work_order.client_response_comment
                    ),
                    "client_responded_at": (
                        work_order.client_responded_at
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )