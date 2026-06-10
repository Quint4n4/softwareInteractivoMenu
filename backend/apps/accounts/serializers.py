"""Serializers de cuentas: entrada y salida separados, sin lógica de negocio."""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Modulo, Plan, Tema, Tenant

User = get_user_model()


class RegisterInput(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    nombre_negocio = serializers.CharField(max_length=120)
    slug = serializers.SlugField(required=False)

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ese usuario ya existe.")
        return value

    def validate_slug(self, value: str) -> str:
        if value and Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Ese subdominio ya está en uso.")
        return value


class UserOutput(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")


class TenantOutput(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = (
            "id", "nombre", "slug", "dominio_propio", "tipo_negocio",
            "modo_vitrina", "idioma_default", "idiomas", "num_mesas", "activo",
        )


# --------------------------- Branding ---------------------------
class TenantUpdateInput(serializers.Serializer):
    # Ajustes del negocio. NO incluye slug/activo (identidad/estado).
    nombre = serializers.CharField(max_length=120, required=False)
    tipo_negocio = serializers.ChoiceField(choices=Tenant.TipoNegocio.choices, required=False)
    modo_vitrina = serializers.ChoiceField(choices=Tenant.ModoVitrina.choices, required=False)
    idioma_default = serializers.CharField(max_length=5, required=False)
    idiomas = serializers.ListField(child=serializers.CharField(max_length=5), required=False)
    num_mesas = serializers.IntegerField(min_value=0, max_value=200, required=False)


class TemaInput(serializers.Serializer):
    color_primario = serializers.CharField(max_length=7, required=False)
    color_secundario = serializers.CharField(max_length=7, required=False)
    tipografia = serializers.CharField(max_length=60, required=False)


class TemaLogoInput(serializers.Serializer):
    logo = serializers.ImageField()


class TemaOutput(serializers.ModelSerializer):
    class Meta:
        model = Tema
        fields = ("color_primario", "color_secundario", "tipografia", "logo", "portada")


# --------------------- Plataforma (super-admin) ---------------------
class PlanOutput(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ("id", "nombre", "precio_base", "descripcion")


class AdminTenantOutput(serializers.ModelSerializer):
    """Vista de un negocio para el panel de plataforma (incluye plan y dueño)."""
    plan_nombre = serializers.CharField(source="plan.nombre", read_only=True, default=None)
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = (
            "id", "nombre", "slug", "tipo_negocio", "modo_vitrina", "idiomas",
            "activo", "plan", "plan_nombre", "owner_email", "creado",
        )

    def get_owner_email(self, obj: Tenant) -> str | None:
        # Itera sobre miembros prefetcheados (sin N+1).
        for m in obj.miembros.all():
            if m.rol == "owner":
                return m.usuario.email
        return None


class AdminTenantUpdateInput(serializers.Serializer):
    # NO incluye 'activo' (se cambia por suspender/reactivar) ni 'slug' (identidad).
    nombre = serializers.CharField(max_length=120, required=False)
    tipo_negocio = serializers.ChoiceField(choices=Tenant.TipoNegocio.choices, required=False)
    modo_vitrina = serializers.ChoiceField(choices=Tenant.ModoVitrina.choices, required=False)
    plan_id = serializers.IntegerField(required=False, allow_null=True)


# ----------------------- Módulos / add-ons -----------------------
class ModuloOutput(serializers.ModelSerializer):
    class Meta:
        model = Modulo
        fields = ("id", "clave", "nombre", "descripcion", "precio_addon")


class TenantModuloOverviewSerializer(serializers.Serializer):
    """Cada módulo + si está activo para el negocio (dict, no modelo)."""
    clave = serializers.CharField()
    nombre = serializers.CharField()
    descripcion = serializers.CharField()
    precio_addon = serializers.DecimalField(max_digits=10, decimal_places=2)
    activo = serializers.BooleanField()
    precio_aplicado = serializers.DecimalField(
        max_digits=10, decimal_places=2, allow_null=True
    )


class TenantModuloSetInput(serializers.Serializer):
    clave = serializers.ChoiceField(choices=Modulo.Clave.choices)
    activo = serializers.BooleanField()
    precio_aplicado = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )
