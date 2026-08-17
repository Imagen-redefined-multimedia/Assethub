from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import (
    Asset,
    MaintenanceReport,
    MaintenanceSchedule,
)


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ["id"]


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
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
        ]

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError(
                "Admin users cannot be created through this endpoint."
            )

        if value not in [
            User.Role.CLIENT,
            User.Role.TECHNICIAN,
        ]:
            raise serializers.ValidationError(
                "Invalid role."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class AssetSerializer(serializers.ModelSerializer):
    client_username = serializers.CharField(
        source="client.username",
        read_only=True,
    )

    class Meta:
        model = Asset
        fields = [
            "id",
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
            "qr_active",
            "qr_created_at",
            "qr_revoked_at",
            "last_qr_scan_at",
            "created_at",
            "updated_at",
        ]

    def validate_client(self, value):
        if value.role != User.Role.CLIENT:
            raise serializers.ValidationError(
                "The selected user must be a Client."
            )

        return value

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
            "work_performed",
            "parts_replaced",
            "priority",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "technician_username",
            "asset_id",
            "asset_name",
            "client_id",
            "created_at",
            "updated_at",
        ]

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(
        source="asset.name",
        read_only=True,
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

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
            "created_by_username",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "asset_name",
            "created_by_username",
            "last_maintenance_date",
            "created_at",
            "updated_at",
        ]