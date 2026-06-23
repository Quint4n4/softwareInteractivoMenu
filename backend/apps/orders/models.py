"""Pedidos — FASE 2. Modelado desde hoy; NO se expone en el MVP."""
from django.db import models

from apps.core.models import TenantModel


class Mesa(TenantModel):
    numero = models.CharField(max_length=20)
    qr = models.OneToOneField(
        "catalog.CodigoQR", on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self):
        return f"Mesa {self.numero}"


class Pedido(TenantModel):
    class Estado(models.TextChoices):
        NUEVO = "nuevo", "Recibido"
        EN_PROCESO = "en_proceso", "En preparación"
        LISTO = "listo", "Listo"
        ENTREGADO = "entregado", "Entregado"
        CANCELADO = "cancelado", "Cancelado"

    class Tipo(models.TextChoices):
        MESA = "mesa", "Comer aquí"
        LLEVAR = "llevar", "Para llevar"

    class MetodoPago(models.TextChoices):
        EFECTIVO = "efectivo", "Efectivo"
        TARJETA = "tarjeta", "Tarjeta"

    numero = models.CharField(max_length=12, blank=True, default="")
    token = models.CharField(max_length=24, blank=True, default="", db_index=True, help_text="Token opaco para el seguimiento público del pedido (no adivinable)")
    nombre_cliente = models.CharField(max_length=120, default="")
    telefono = models.CharField(max_length=20, blank=True, default="", help_text="WhatsApp del cliente para enviarle el ticket")
    tipo = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.MESA)
    mesa_texto = models.CharField(max_length=20, blank=True, default="", help_text="Número de mesa")
    mesa = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True, blank=True)
    nota = models.CharField(max_length=200, blank=True)
    metodo_pago = models.CharField(max_length=10, choices=MetodoPago.choices, default=MetodoPago.EFECTIVO)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.NUEVO)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    propina = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    eta_min = models.PositiveIntegerField(
        default=0,
        help_text="Tiempo estimado de preparación en minutos (calculado al crear el pedido)",
    )

    class Meta:
        ordering = ["-creado"]

    def __str__(self):
        return f"{self.numero or self.pk} · {self.nombre_cliente} ({self.estado})"


class PedidoItem(TenantModel):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="lineas")
    item = models.ForeignKey("catalog.Item", on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    notas = models.CharField(max_length=200, blank=True)


class Pago(TenantModel):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        APROBADO = "aprobado", "Aprobado"
        RECHAZADO = "rechazado", "Rechazado"

    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name="pago")
    pasarela = models.CharField(max_length=30, default="mercado_pago")
    referencia = models.CharField(max_length=120, blank=True)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.PENDIENTE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
