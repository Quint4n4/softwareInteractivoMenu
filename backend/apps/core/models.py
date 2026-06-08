"""Modelos base reutilizables. No generan tablas (son abstractos)."""
from django.db import models

from .managers import TenantManager
from .tenant import get_current_tenant


class TimeStamped(models.Model):
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TenantModel(TimeStamped):
    """Base para todo lo que pertenece a un negocio. Garantiza el aislamiento.

    Expone dos managers:
      - objects: filtra por el tenant del contexto (ver TenantManager).
      - all_objects: sin filtrar (uso de super-admin / paneles internos).
    """
    tenant = models.ForeignKey(
        "accounts.Tenant", on_delete=models.CASCADE, related_name="%(class)ss"
    )

    objects = TenantManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Si no se asignó tenant explícito, usa el del contexto (vitrina pública).
        if self.tenant_id is None:
            tenant = get_current_tenant()
            if tenant is not None:
                self.tenant = tenant
        super().save(*args, **kwargs)
