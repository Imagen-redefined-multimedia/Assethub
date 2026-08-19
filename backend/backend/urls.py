"""
URL configuration for backend project.
"""

from django.contrib import admin
from django.urls import path

from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from api.views import (
    CompanyDetailView,
    CompanyListCreateView,
    MaintenanceReportPhotoUploadView,
    MeView,
    ProfileView,

    # Users
    UserListCreateView,
    UserDetailView,

    # Assets
    AssetListCreateView,
    AssetDetailView,
    AssetQRCodeView,
    QRScanView,

    # Maintenance
    MaintenanceListCreateView,
    MaintenanceDetailView,
    MaintenanceScheduleListCreateView,
    MaintenanceScheduleDetailView,

    # Maintenance Reports
    MaintenanceReportListCreateView,
    MaintenanceReportDetailView,
    MaintenanceReportReviewView,
    RejectedMaintenanceReportListView,
    MaintenanceReassignView,

    # Work Orders
    WorkOrderListCreateView,
    WorkOrderDetailView,
)


urlpatterns = [

    # ========================================================
    # DJANGO ADMIN
    # ========================================================

    path(
        "admin/",
        admin.site.urls,
    ),


    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token-obtain-pair",
    ),

    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "api/auth/me/",
        MeView.as_view(),
        name="me",
    ),


    # ========================================================
    # USERS
    # ========================================================

    path(
        "api/users/",
        UserListCreateView.as_view(),
        name="users",
    ),

    path(
        "api/users/<int:pk>/",
        UserDetailView.as_view(),
        name="user-detail",
    ),


    # ========================================================
    # ASSETS
    # ========================================================

    path(
        "api/assets/",
        AssetListCreateView.as_view(),
        name="assets",
    ),

    path(
        "api/assets/<int:pk>/",
        AssetDetailView.as_view(),
        name="asset-detail",
    ),

    path(
        "api/assets/<int:pk>/qr/",
        AssetQRCodeView.as_view(),
        name="asset-qr",
    ),


    # ========================================================
    # QR SCANNING
    # ========================================================

    path(
        "api/qr/scan/<str:token>/",
        QRScanView.as_view(),
        name="qr-scan",
    ),


    # ========================================================
    # MAINTENANCE SCHEDULES
    # ========================================================

    path(
        "api/maintenance-schedules/",
        MaintenanceScheduleListCreateView.as_view(),
        name="maintenance-schedule-list-create",
    ),

    path(
        "api/maintenance-schedules/<int:pk>/",
        MaintenanceScheduleDetailView.as_view(),
        name="maintenance-schedule-detail",
    ),


    # ========================================================
    # MAINTENANCE
    # ========================================================

    path(
        "api/maintenance/",
        MaintenanceListCreateView.as_view(),
        name="maintenance-list-create",
    ),

    path(
        "api/maintenance/<int:pk>/",
        MaintenanceDetailView.as_view(),
        name="maintenance-detail",
    ),


    # ========================================================
    # WORK ORDERS
    # ========================================================

    path(
        "api/work-orders/",
        WorkOrderListCreateView.as_view(),
        name="work-order-list-create",
    ),

    path(
        "api/work-orders/<int:pk>/",
        WorkOrderDetailView.as_view(),
        name="work-order-detail",
    ),


    # ========================================================
    # MAINTENANCE REPORTS
    # ========================================================

    path(
        "api/maintenance-reports/",
        MaintenanceReportListCreateView.as_view(),
        name="maintenance-report-list",
    ),

    path(
        "api/maintenance-reports/<int:pk>/",
        MaintenanceReportDetailView.as_view(),
        name="maintenance-report-detail",
    ),


    # ========================================================
    # CLIENT REVIEW
    # ========================================================

    path(
        "api/maintenance-reports/<int:pk>/review/",
        MaintenanceReportReviewView.as_view(),
        name="maintenance-report-review",
    ),


    # ========================================================
    # ADMIN - REJECTED REPORTS
    # ========================================================

    path(
        "api/maintenance-reports/rejected/",
        RejectedMaintenanceReportListView.as_view(),
        name="rejected-maintenance-reports",
    ),


    # ========================================================
    # ADMIN - REASSIGN MAINTENANCE
    # ========================================================

    path(
        "api/maintenance-reports/<int:pk>/reassign/",
        MaintenanceReassignView.as_view(),
        name="maintenance-reassign",
    ),

    path(
    "api/profile/",
    ProfileView.as_view(),
    name="profile",
),

path(
    "api/companies/",
    CompanyListCreateView.as_view(),
    name="company-list-create",
),

path(
    "api/companies/<int:pk>/",
    CompanyDetailView.as_view(),
    name="company-detail",
),

path(
    "api/maintenance-reports/<int:pk>/photos/",
    MaintenanceReportPhotoUploadView.as_view(),
    name="maintenance-report-photo-upload",
),

path(
    "api/schema/",
    SpectacularAPIView.as_view(),
    name="schema",
),

path(
    "api/docs/",
    SpectacularSwaggerView.as_view(
        url_name="schema"
    ),
    name="swagger-ui",
),

path(
    "api/redoc/",
    SpectacularRedocView.as_view(
        url_name="schema"
    ),
    name="redoc",
),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)