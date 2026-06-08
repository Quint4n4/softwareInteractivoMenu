"""Lecturas de cuentas."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from django.contrib.auth.models import AbstractBaseUser
from django.db.models import QuerySet
from rest_framework.exceptions import NotFound

from .models import Membership, Modulo, Plan, Tema, Tenant, TenantModulo


def membership_for_user(*, user: AbstractBaseUser) -> Membership | None:
    return user.membresias.select_related("tenant").first()


def tema_get(*, tenant: Tenant) -> Tema:
    """El Tema se crea junto con el negocio; si faltara, se crea al vuelo."""
    tema, _ = Tema.objects.get_or_create(tenant=tenant)
    return tema


# ---------------- Plataforma (super-admin, cruza todos los negocios) ----------------
def tenant_list_all() -> QuerySet[Tenant]:
    """TODOS los negocios. Solo para el panel de plataforma (super-admin)."""
    return (
        Tenant.objects.select_related("plan")
        .prefetch_related("miembros__usuario")
        .order_by("-creado")
    )


def tenant_get_any(*, tenant_id: UUID) -> Tenant:
    """Un negocio por id, sin filtrar por tenant del usuario (uso de plataforma)."""
    try:
        return (
            Tenant.objects.select_related("plan")
            .prefetch_related("miembros__usuario")
            .get(id=tenant_id)
        )
    except Tenant.DoesNotExist:
        raise NotFound("Negocio no encontrado.")


def plan_list() -> QuerySet[Plan]:
    return Plan.objects.order_by("precio_base")


# ---------------- Módulos / add-ons (plataforma) ----------------
def modulo_list() -> QuerySet[Modulo]:
    return Modulo.objects.order_by("nombre")


def tenant_modulos_overview(*, tenant: Tenant) -> list[dict[str, Any]]:
    """Catálogo de módulos + si están activos para este negocio (sin N+1)."""
    asignados = {tm.modulo_id: tm for tm in TenantModulo.objects.filter(tenant=tenant)}
    overview: list[dict[str, Any]] = []
    for m in Modulo.objects.order_by("nombre"):
        tm = asignados.get(m.id)
        overview.append(
            {
                "clave": m.clave,
                "nombre": m.nombre,
                "descripcion": m.descripcion,
                "precio_addon": m.precio_addon,
                "activo": bool(tm and tm.activo),
                "precio_aplicado": tm.precio_aplicado if tm else None,
            }
        )
    return overview


def tenant_has_modulo(*, tenant: Tenant, clave: str) -> bool:
    """¿El negocio tiene activo el módulo <clave>? (uso en la vitrina, Paso D)."""
    return TenantModulo.objects.filter(
        tenant=tenant, modulo__clave=clave, activo=True
    ).exists()


def tenant_active_modulos(*, tenant: Tenant) -> list[str]:
    """Claves de los módulos activos del negocio (para exponer en la vitrina)."""
    return list(
        TenantModulo.objects.filter(tenant=tenant, activo=True).values_list(
            "modulo__clave", flat=True
        )
    )
