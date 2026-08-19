import secrets
from datetime import timedelta

from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class Company(models.Model):
    name = models.CharField(max_length=255)
    registration_number = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(
        upload_to="companies/logos/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TECHNICIAN = "TECHNICIAN", "Technician"
        CLIENT = "CLIENT", "Client"

    company = models.ForeignKey(
    Company,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="users",
)

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

    company = models.ForeignKey(
    Company,
    on_delete=models.CASCADE,
    related_name="assets",
    null=True,
    blank=True,
    )
    
    name = models.CharField(max_length=255)
    serial_number = models.CharField(
        max_length=100,
        unique=True,
    )
    description = models.TextField(blank=True)

    # Random token used by the QR code
    qr_token = models.CharField(
        max_length=64,
        unique=True,
        editable=False,
    )

    qr_active = models.BooleanField(default=True)
    qr_created_at = models.DateTimeField(auto_now_add=True)
    qr_revoked_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    last_qr_scan_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.qr_token:
            self.qr_token = secrets.token_urlsafe(32)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.serial_number}"


class MaintenanceSchedule(models.Model):

    class FrequencyUnit(models.TextChoices):
        DAYS = "DAYS", "Days"
        WEEKS = "WEEKS", "Weeks"
        MONTHS = "MONTHS", "Months"
        YEARS = "YEARS", "Years"

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="maintenance_schedule",
    )

    frequency = models.PositiveIntegerField(
        help_text="How often maintenance should occur.",
    )

    frequency_unit = models.CharField(
        max_length=10,
        choices=FrequencyUnit.choices,
    )

    next_maintenance_date = models.DateField(
        null=True,
        blank=True,
    )

    last_maintenance_date = models.DateField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="maintenance_schedules_created",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def calculate_next_date(self, from_date=None):
        if from_date is None:
            from_date = timezone.localdate()

        if self.frequency_unit == self.FrequencyUnit.DAYS:
            return from_date + timedelta(
                days=self.frequency
            )

        if self.frequency_unit == self.FrequencyUnit.WEEKS:
            return from_date + timedelta(
                weeks=self.frequency
            )

        if self.frequency_unit == self.FrequencyUnit.MONTHS:
            return from_date + relativedelta(
                months=self.frequency
            )

        if self.frequency_unit == self.FrequencyUnit.YEARS:
            return from_date + relativedelta(
                years=self.frequency
            )

        return from_date

    @property
    def schedule_status(self):
        if not self.is_active:
            return "INACTIVE"

        if not self.next_maintenance_date:
            return "NOT_SCHEDULED"

        today = timezone.localdate()

        if self.next_maintenance_date < today:
            return "OVERDUE"

        if self.next_maintenance_date <= today + timedelta(
            days=7
        ):
            return "DUE_SOON"

        return "UPCOMING"

    def __str__(self):
        return (
            f"{self.asset.name} - "
            f"Every {self.frequency} "
            f"{self.frequency_unit.lower()}"
        )


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

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="work_orders",
        null=True,
        blank=True,
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

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    maintenance = models.OneToOneField(
        Maintenance,
        on_delete=models.CASCADE,
        related_name="report",
    )

    summary = models.TextField()

    findings = models.TextField()

    work_performed = models.TextField()

    parts_replaced = models.TextField(
        blank=True,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    # --------------------------------------------------------
    # ADMIN / REASSIGNMENT
    # --------------------------------------------------------

    requires_admin_action = models.BooleanField(
        default=False,
    )

    reassignment_count = models.PositiveIntegerField(
        default=0,
    )

    # --------------------------------------------------------
    # CLIENT REVIEW
    # --------------------------------------------------------

    review_status = models.CharField(
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
    )

    review_comment = models.TextField(
        blank=True,
        default="",
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

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

    image = models.ImageField(
        upload_to="maintenance_reports/%Y/%m/%d/",
    )

    photo_type = models.CharField(
        max_length=10,
        choices=PhotoType.choices,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.photo_type} photo - "
            f"Report #{self.report.id}"
        )


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

    scanned_at = models.DateTimeField(
        auto_now_add=True,
    )

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