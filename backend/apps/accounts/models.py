"""Cuentas, negocios (tenants), planes y módulos (plugins)."""
import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TenantModel, TimeStamped


class Tenant(TimeStamped):
    """Cada negocio (restaurante, tienda, etc.) es un tenant."""

    class TipoNegocio(models.TextChoices):
        RESTAURANTE = "restaurante", "Restaurante"
        TIENDA = "tienda", "Tienda / Comercio"
        OTRO = "otro", "Otro"

    class ModoVitrina(models.TextChoices):
        MENU = "menu", "Solo Menú"
        CATALOGO = "catalogo", "Solo Catálogo"
        AMBOS = "ambos", "Menú y Catálogo"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, help_text="Subdominio: <slug>.tudominio.com")
    dominio_propio = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )
    tipo_negocio = models.CharField(
        max_length=20, choices=TipoNegocio.choices, default=TipoNegocio.RESTAURANTE
    )
    modo_vitrina = models.CharField(
        max_length=10, choices=ModoVitrina.choices, default=ModoVitrina.MENU
    )
    idioma_default = models.CharField(max_length=5, default="es")
    idiomas = models.JSONField(default=list, blank=True, help_text='["es", "en"]')
    activo = models.BooleanField(default=True)
    plan = models.ForeignKey(
        "Plan", on_delete=models.SET_NULL, null=True, blank=True, related_name="tenants"
    )

    def __str__(self):
        return self.nombre


class Tema(models.Model):
    """Branding del tenant: el 'frontend distinto' por configuración."""
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name="tema")
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    portada = models.ImageField(upload_to="portadas/", blank=True, null=True)
    color_primario = models.CharField(max_length=7, default="#1F3864")
    color_secundario = models.CharField(max_length=7, default="#2E75B6")
    tipografia = models.CharField(max_length=60, default="Inter")

    def __str__(self):
        return f"Tema de {self.tenant}"


class Membership(TimeStamped):
    """Relaciona usuarios (Django auth) con un tenant y su rol."""

    class Rol(models.TextChoices):
        OWNER = "owner", "Dueño"
        STAFF = "staff", "Personal"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="miembros")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="membresias"
    )
    rol = models.CharField(max_length=10, choices=Rol.choices, default=Rol.OWNER)

    class Meta:
        unique_together = ("tenant", "usuario")

    def __str__(self):
        return f"{self.usuario} @ {self.tenant} ({self.rol})"


class Plan(TimeStamped):
    nombre = models.CharField(max_length=60)
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Modulo(TimeStamped):
    """Catálogo de módulos/plugins disponibles en la plataforma."""

    class Clave(models.TextChoices):
        MENU = "menu", "Menú"
        CATALOGO = "catalogo", "Catálogo de productos"
        ORDER_PAY = "order_pay", "Order & Pay"
        RESERVAS = "reservas", "Reservas"
        FIDELIDAD = "fidelidad", "Fidelización"

    clave = models.CharField(max_length=20, choices=Clave.choices, unique=True)
    nombre = models.CharField(max_length=60)
    descripcion = models.TextField(blank=True)
    precio_addon = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.nombre


class TenantModulo(TimeStamped):
    """Feature flag + facturación: qué módulos tiene activos cada tenant."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="modulos")
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    precio_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tenant", "modulo")

    def __str__(self):
        return f"{self.tenant} · {self.modulo}"


class Suscripcion(TenantModel):
    class Estado(models.TextChoices):
        PRUEBA = "prueba", "Periodo de prueba"
        ACTIVA = "activa", "Activa"
        SUSPENDIDA = "suspendida", "Suspendida"
        CANCELADA = "cancelada", "Cancelada"

    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.PRUEBA)
    inicia = models.DateField()
    proximo_cobro = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Suscripción {self.tenant} ({self.estado})"
