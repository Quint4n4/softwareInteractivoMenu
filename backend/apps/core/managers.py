"""
Manager que filtra automáticamente por el tenant actual del contexto.

- Si hay un tenant en el contexto (peticiones a la vitrina pública vía
  middleware), las consultas se limitan a ese tenant.
- Si NO hay tenant (admin de Django, shell, migraciones), no filtra, para
  permitir operación de super-admin. Las vistas del panel del dueño filtran
  además por la membresía del usuario, de modo que nunca dependen solo de esto.
"""
from django.db import models

from .tenant import get_current_tenant


class TenantManager(models.Manager):
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = get_current_tenant()
        if tenant is not None:
            return qs.filter(tenant=tenant)
        return qs
