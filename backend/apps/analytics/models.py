"""Métricas básicas de la vitrina."""
from django.db import models

from apps.core.models import TenantModel


class EventoVista(TenantModel):
    item = models.ForeignKey(
        "catalog.Item", on_delete=models.SET_NULL, null=True, blank=True
    )
    tipo = models.CharField(max_length=30, default="vista_menu")
    # 'creado' (heredado de TimeStamped) sirve como timestamp del evento

    def __str__(self):
        return f"{self.tipo} @ {self.creado:%Y-%m-%d}"
