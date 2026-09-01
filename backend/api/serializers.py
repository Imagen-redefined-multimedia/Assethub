from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field

from rest_framework import serializers

from .models import (
    Asset,
    Company,
    Maintenance,
    MaintenanceReport,
    MaintenanceReportPhoto,
    MaintenanceSchedule,
    WorkOrder,
)


User = get_user_model()


# ============================================================
# COMPANY
# ============================================================

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "registration_number",
            "email",
            "phone",
            "address",
            "logo",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# USER
# ============================================================

class UserSerializer(serializers.ModelSerializer):
    """
    Used when returning users.

    company_id and company_name are read-only because the
    company assignment is handled through create/update.
    """

    company_id = serializers.IntegerField(
        source="company.id",
        read_only=True,
        allow_null=True,
    )

    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "company_id",
            "company_name",
        ]

        read_only_fields = [
            "id",
            "company_id",
            "company_name",
        ]


# ============================================================
# USER CREATE
# ============================================================

class UserCreateSerializer(serializers.ModelSerializer):
    """
    Used when an ADMIN creates a technician or client.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "company",
        ]

    def validate(self, attrs):
        role = attrs.get("role")
        company = attrs.get("company")

        # ----------------------------------------------------
        # ADMIN
        # ----------------------------------------------------

        if role == User.Role.ADMIN:
            raise serializers.ValidationError({
                "role": (
                    "Admin users cannot be created "
                    "through this endpoint."
                )
            })

        # ----------------------------------------------------
        # VALID ROLES
        # ----------------------------------------------------

        if role not in [
            User.Role.CLIENT,
            User.Role.TECHNICIAN,
        ]:
            raise serializers.ValidationError({
                "role": "Invalid role."
            })

        # ----------------------------------------------------
        # CLIENT MUST HAVE A COMPANY
        # ----------------------------------------------------

        if role == User.Role.CLIENT and company is None:
            raise serializers.ValidationError({
                "company": (
                    "A company is required when "
                    "creating a client."
                )
            })

        # ----------------------------------------------------
        # TECHNICIANS
        # ----------------------------------------------------
        #
        # Technicians can optionally belong to a company.
        #
        # If your business rule is that technicians MUST also
        # belong to a company, change this to the same rule
        # used for clients.
        #

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user


# ============================================================
# USER UPDATE
# ============================================================

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Used when an ADMIN edits a technician or client.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    company = serializers.PrimaryKeyRelatedField(
        queryset=Company.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
            "company",
        ]

    def validate(self, attrs):
        role = attrs.get(
            "role",
            self.instance.role if self.instance else None,
        )

        company = attrs.get(
            "company",
            self.instance.company if self.instance else None,
        )

        # ----------------------------------------------------
        # ADMIN
        # ----------------------------------------------------

        if role == User.Role.ADMIN:
            raise serializers.ValidationError({
                "role": (
                    "Users cannot be created or changed "
                    "to Administrator through this endpoint."
                )
            })

        # ----------------------------------------------------
        # CLIENT MUST HAVE COMPANY
        # ----------------------------------------------------

        if role == User.Role.CLIENT and company is None:
            raise serializers.ValidationError({
                "company": (
                    "A company is required for clients."
                )
            })

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop(
            "password",
            None,
        )

        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance


# ============================================================
# ASSET
# ============================================================

class AssetSerializer(serializers.ModelSerializer):

    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
    )

    client_username = serializers.CharField(
        source="client.username",
        read_only=True,
    )

    class Meta:
        model = Asset

        fields = [
            "id",
            "company",
            "company_name",
            "client",
            "client_username",
            "name",
            "serial_number",
            "description",
            "qr_active",
            "qr_created_at",
            "qr_revoked_at",
            "last_qr_scan_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "company_name",
            "client_username",
            "qr_active",
            "qr_created_at",
            "qr_revoked_at",
            "last_qr_scan_at",
            "created_at",
            "updated_at",
        ]


# ============================================================
# MAINTENANCE REPORT PHOTO
# ============================================================

class MaintenanceReportPhotoSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = MaintenanceReportPhoto

        fields = [
            "id",
             "report_id",
            "image",
            "photo_type",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
             "report_id",
            "uploaded_at",
        ]


# ============================================================
# MAINTENANCE REPORT
# ============================================================

class MaintenanceReportSerializer(serializers.ModelSerializer):

    technician_username = serializers.CharField(
        source="maintenance.technician.username",
        read_only=True,
    )

    asset_id = serializers.IntegerField(
        source="maintenance.work_order.asset.id",
        read_only=True,
    )

    asset_name = serializers.CharField(
        source="maintenance.work_order.asset.name",
        read_only=True,
    )

    client_id = serializers.IntegerField(
        source="maintenance.work_order.client.id",
        read_only=True,
    )

    photos = MaintenanceReportPhotoSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = MaintenanceReport

        fields = [
            "id",
            "maintenance",
            "technician_username",
            "asset_id",
            "asset_name",
            "client_id",
            "summary",
            "findings",
            "photos",
            "work_performed",
            "parts_replaced",
            "priority",
            "status",
            "created_at",
            "updated_at",
            "review_status",
            "reviewed_at",
            "review_comment",
        ]

        read_only_fields = [
            "id",
            "technician_username",
            "asset_id",
            "asset_name",
            "client_id",
            "photos",
            "created_at",
            "updated_at",
        ]


# ============================================================
# MAINTENANCE SCHEDULE
# ============================================================

class MaintenanceScheduleSerializer(
    serializers.ModelSerializer
):

    asset_name = serializers.CharField(
        source="asset.name",
        read_only=True,
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    schedule_status = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField())
    def get_schedule_status(self, obj):
        return obj.schedule_status

    class Meta:
        model = MaintenanceSchedule

        fields = [
            "id",
            "asset",
            "asset_name",
            "frequency",
            "frequency_unit",
            "next_maintenance_date",
            "last_maintenance_date",
            "is_active",
            "schedule_status",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "asset_name",
            "next_maintenance_date",
            "last_maintenance_date",
            "schedule_status",
            "created_by_username",
            "created_at",
            "updated_at",
        ]


# ============================================================
# MAINTENANCE
# ============================================================

class MaintenanceSerializer(serializers.ModelSerializer):

    # --------------------------------------------------------
    # TECHNICIAN
    # --------------------------------------------------------

    technician_username = serializers.CharField(
        source="technician.username",
        read_only=True,
    )

    # --------------------------------------------------------
    # WORK ORDER
    # --------------------------------------------------------

    work_order_title = serializers.CharField(
        source="work_order.title",
        read_only=True,
    )

    work_order_description = serializers.CharField(
        source="work_order.description",
        read_only=True,
    )

    work_order_status = serializers.CharField(
        source="work_order.status",
        read_only=True,
    )

    # --------------------------------------------------------
    # CLIENT
    # --------------------------------------------------------

    client_id = serializers.IntegerField(
        source="work_order.client.id",
        read_only=True,
    )

    client_username = serializers.CharField(
        source="work_order.client.username",
        read_only=True,
    )

    client_email = serializers.EmailField(
        source="work_order.client.email",
        read_only=True,
    )

    client_first_name = serializers.CharField(
        source="work_order.client.first_name",
        read_only=True,
    )

    client_last_name = serializers.CharField(
        source="work_order.client.last_name",
        read_only=True,
    )

    # --------------------------------------------------------
    # COMPANY
    # --------------------------------------------------------

    company_id = serializers.IntegerField(
        source="work_order.client.company.id",
        read_only=True,
        allow_null=True,
    )

    company_name = serializers.CharField(
        source="work_order.client.company.name",
        read_only=True,
        allow_null=True,
    )

    company_registration_number = serializers.CharField(
        source=(
            "work_order.client.company.registration_number"
        ),
        read_only=True,
        allow_null=True,
    )

    company_email = serializers.EmailField(
        source="work_order.client.company.email",
        read_only=True,
        allow_null=True,
    )

    company_phone = serializers.CharField(
        source="work_order.client.company.phone",
        read_only=True,
        allow_null=True,
    )

    company_address = serializers.CharField(
        source="work_order.client.company.address",
        read_only=True,
        allow_null=True,
    )

    # --------------------------------------------------------
    # ASSET
    # --------------------------------------------------------

    asset_id = serializers.IntegerField(
        source="work_order.asset.id",
        read_only=True,
    )

    asset_name = serializers.CharField(
        source="work_order.asset.name",
        read_only=True,
    )

    asset_serial_number = serializers.CharField(
        source="work_order.asset.serial_number",
        read_only=True,
    )

    asset_description = serializers.CharField(
        source="work_order.asset.description",
        read_only=True,
    )

    class Meta:
        model = Maintenance

        fields = [
            "id",

            # Work order
            "work_order",
            "work_order_title",
            "work_order_description",
            "work_order_status",

            # Company
            "company_id",
            "company_name",
            "company_registration_number",
            "company_email",
            "company_phone",
            "company_address",

            # Client
            "client_id",
            "client_username",
            "client_email",
            "client_first_name",
            "client_last_name",

            # Asset
            "asset_id",
            "asset_name",
            "asset_serial_number",
            "asset_description",

            # Technician
            "technician",
            "technician_username",

            # Maintenance
            "description",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "work_order_title",
            "work_order_description",
            "work_order_status",

            "company_id",
            "company_name",
            "company_registration_number",
            "company_email",
            "company_phone",
            "company_address",

            "client_id",
            "client_username",
            "client_email",
            "client_first_name",
            "client_last_name",

            "asset_id",
            "asset_name",
            "asset_serial_number",
            "asset_description",

            "technician_username",

            "created_at",
            "updated_at",
        ]


# ============================================================
# WORK ORDER
# ============================================================

class WorkOrderSerializer(serializers.ModelSerializer):

    client_username = serializers.CharField(
        source="client.username",
        read_only=True,
    )

    company_name = serializers.CharField(
        source="company.name",
        read_only=True,
    )

    asset_name = serializers.CharField(
        source="asset.name",
        read_only=True,
    )

    class Meta:
        model = WorkOrder

        fields = [
            "id",
            "company",
            "company_name",
            "client",
            "client_username",
            "asset",
            "asset_name",
            "title",
            "description",
            "status",


            "client_response",
            "client_response_comment",
            "client_responded_at",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "company_name",
            "client_username",
            "asset_name",

            "client_response",
            "client_response_comment",
            "client_responded_at",

            "created_at",
            "updated_at",
        ]


# ============================================================
# PROFILE
# ============================================================

class ProfileSerializer(serializers.ModelSerializer):

    company = CompanySerializer(
        read_only=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "company",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "company",
        ]


# ============================================================
# MAINTENANCE REPORT REVIEW
# ============================================================

class MaintenanceReportReviewSerializer(
    serializers.Serializer
):
    action = serializers.ChoiceField(
        choices=["ACCEPT", "REJECT"],
    )

    comment = serializers.CharField(
        required=False,
        allow_blank=True,
    )


# ============================================================
# MAINTENANCE REASSIGN
# ============================================================

class MaintenanceReassignSerializer(
    serializers.Serializer
):
    technician = serializers.IntegerField()


# ============================================================
# MAINTENANCE REPORT PHOTO UPLOAD
# ============================================================

class MaintenanceReportPhotoUploadSerializer(
    serializers.Serializer
):
    image = serializers.ImageField()

    photo_type = serializers.ChoiceField(
        choices=["ISSUE", "FIXED"],
    )


# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordSerializer(serializers.Serializer):

    current_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(
            attrs["current_password"]
        ):
            raise serializers.ValidationError({
                "current_password": (
                    "Current password is incorrect."
                )
            })

        if (
            attrs["new_password"]
            != attrs["confirm_password"]
        ):
            raise serializers.ValidationError({
                "confirm_password": (
                    "Passwords do not match."
                )
            })

        if (
            attrs["current_password"]
            == attrs["new_password"]
        ):
            raise serializers.ValidationError({
                "new_password": (
                    "New password must be different "
                    "from the current password."
                )
            })

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user

class WorkOrderResponseSerializer(serializers.Serializer):

    action = serializers.ChoiceField(
        choices=[
            ("ACCEPT", "Accept"),
            ("REJECT", "Reject"),
        ]
    )

    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def validate(self, attrs):

        action = attrs["action"]
        comment = attrs.get("comment", "").strip()

        if action == "REJECT" and not comment:
            raise serializers.ValidationError(
                {
                    "comment": (
                        "A comment is required "
                        "when rejecting a work order."
                    )
                }
            )

        attrs["comment"] = comment

        return attrs