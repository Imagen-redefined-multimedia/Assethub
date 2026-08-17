"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from api.views import (
    MaintenanceListCreateView,
    MaintenanceDetailView,
    MaintenanceReportDetailView,
    MaintenanceReportListCreateView,
    MaintenanceReportReviewView,
    MaintenanceScheduleDetailView,
    MaintenanceScheduleListCreateView,
    UserListCreateView,
    UserDetailView,
    AssetListCreateView,
    AssetDetailView,
    AssetDetailView,
    AssetQRCodeView,
     QRScanView,
    WorkOrderDetailView,
    WorkOrderListCreateView,
)

from api.views import MeView

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Authentication endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/users/", UserListCreateView.as_view(), name="users"),
    path("api/users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    # Assets
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

    path(
    "api/qr/scan/<str:token>/",
    QRScanView.as_view(),
    name="qr-scan",
),

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
path(
    "api/maintenance-reports/",
    MaintenanceReportListCreateView.as_view(),
    name="maintenance-report-list",
),
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

path(
    "api/maintenance-reports/<int:pk>/review/",
    MaintenanceReportReviewView.as_view(),
    name="maintenance-report-review",
),
path(
    "api/maintenance-reports/<int:pk>/",
    MaintenanceReportDetailView.as_view(),
    name="maintenance-report-detail",
),
]
