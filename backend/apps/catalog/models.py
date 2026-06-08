"""Motor de contenido: MENÚ y CATÁLOGO comparten la misma estructura."""
import uuid

from django.db import models

from apps.core.models import TenantModel


class Coleccion(TenantModel):
    """Un menú o un catálogo. El 'tipo' decide cómo se presenta."""

    class Tipo(models.TextChoices):
        MENU = "menu", "Menú"
        CATALOGO = "catalogo", "Catálogo"

    tipo = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.MENU)
    nombre = models.CharField(max_length=120)
    activo = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"


class Categoria(TenantModel):
    coleccion = models.ForeignKey(
        Coleccion, on_delete=models.CASCADE, related_name="categorias"
    )
    nombre = models.CharField(max_length=120)
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True)
    i18n = models.JSONField(
        default=dict, blank=True, help_text='{"en": {"nombre": "..."}}'
    )

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.nombre


class Item(TenantModel):
    """Platillo (menú) o producto (catálogo)."""
    categoria = models.ForeignKey(
        Categoria, on_delete=models.CASCADE, related_name="items"
    )
    nombre = models.CharField(max_length=160)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    moneda = models.CharField(max_length=3, default="MXN")
    imagen = models.ImageField(upload_to="items/", blank=True, null=True)
    disponible = models.BooleanField(default=True)
    destacado = models.BooleanField(default=False)
    etiqueta = models.CharField(
        max_length=40, blank=True, help_text="Ej. 'Favorito', 'Ligero', 'Nuevo'"
    )
    orden = models.PositiveIntegerField(default=0)
    # Paquete / combo: una lista de lo que incluye (ej. "Desayuno Canela").
    es_paquete = models.BooleanField(default=False)
    incluye = models.JSONField(
        default=list, blank=True, help_text='["Café", "Pan dulce", ...]'
    )
    # Campos propios del catálogo (opcionales para menú)
    sku = models.CharField(max_length=60, blank=True)
    stock = models.IntegerField(
        null=True, blank=True, help_text="Null = no se controla inventario"
    )
    i18n = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["orden"]

    def __str__(self):
        return self.nombre


class Variante(TenantModel):
    """Tamaños / opciones con precio extra (ej. chico/grande)."""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="variantes")
    nombre = models.CharField(max_length=80)
    precio_extra = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.nombre


class CodigoQR(TenantModel):
    class Tipo(models.TextChoices):
        VITRINA = "vitrina", "Vitrina general"
        MESA = "mesa", "Mesa"

    tipo = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.VITRINA)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    etiqueta = models.CharField(max_length=60, blank=True, help_text="Ej. 'Mesa 4'")

    def __str__(self):
        return self.etiqueta or str(self.token)
