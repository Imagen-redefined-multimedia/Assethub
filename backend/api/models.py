import secrets

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TECHNICIAN = "TECHNICIAN", "Technician"
        CLIENT = "CLIENT", "Client"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Asset(models.Model):
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assets",
        limit_choices_to={"role": User.Role.CLIENT},
    )

    name = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    # Random token used by the QR code
    qr_token = models.CharField(
        max_length=64,
        unique=True,
        editable=False,
    )

    qr_active = models.BooleanField(default=True)
    qr_created_at = models.DateTimeField(auto_now_add=True)
    qr_revoked_at = models.DateTimeField(null=True, blank=True)
    last_qr_scan_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.qr_token:
            self.qr_token = secrets.token_urlsafe(32)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.serial_number}"


class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="work_orders",
        limit_choices_to={"role": User.Role.CLIENT},
    )

    asset = models.ForeignKey(
        Asset,
        on_delete=models.CASCADE,
        related_name="work_orders",
    )

    title = models.CharField(max_length=255)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"WO-{self.id}: {self.title}"


class Maintenance(models.Model):
    class Status(models.TextChoices):
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name="maintenance_tasks",
    )

    technician = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="maintenance_tasks",
        limit_choices_to={"role": User.Role.TECHNICIAN},
    )

    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ASSIGNED,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Maintenance #{self.id}"


class MaintenanceReport(models.Model):
    maintenance = models.OneToOneField(
        Maintenance,
        on_delete=models.CASCADE,
        related_name="report",
    )

    summary = models.TextField()
    findings = models.TextField()
    work_performed = models.TextField()
    parts_replaced = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report #{self.id}"


class MaintenanceReportPhoto(models.Model):
    class PhotoType(models.TextChoices):
        ISSUE = "ISSUE", "Issue"
        FIXED = "FIXED", "Fixed"

    report = models.ForeignKey(
        MaintenanceReport,
        on_delete=models.CASCADE,
        related_name="photos",
    )

    image = models.ImageField(upload_to="maintenance_reports/%Y/%m/%d/")
    photo_type = models.CharField(
        max_length=10,
        choices=PhotoType.choices,
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.photo_type} photo - Report #{self.report.id}"


class QRScanLog(models.Model):
    class Result(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        DENIED = "DENIED", "Denied"
        INVALID = "INVALID", "Invalid"

    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qr_scan_logs",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qr_scan_logs",
    )

    scanned_at = models.DateTimeField(auto_now_add=True)

    result = models.CharField(
        max_length=10,
        choices=Result.choices,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        blank=True,
    )

    def __str__(self):
        return f"QR scan #{self.id} - {self.result}"