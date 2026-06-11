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
        .prefetch_related("miembros__usuario", "modulos__modulo")
        .order_by("-creado")
    )


def tenant_get_any(*, tenant_id: UUID) -> Tenant:
    """Un negocio por id, sin filtrar por tenant del usuario (uso de plataforma)."""
    try:
        return (
            Tenant.objects.select_related("plan")
            .prefetch_related("miembros__usuario", "modulos__modulo")
            .get(id=tenant_id)
        )
    except Tenant.DoesNotExist:
        raise NotFound("Negocio no encontrado.")


def plan_list() -> QuerySet[Plan]:
    return Plan.objects.order_by("precio_base")


def plan_get(*, plan_id: int) -> Plan:
    try:
        return Plan.objects.get(id=plan_id)
    except Plan.DoesNotExist:
        raise NotFound("Plan no encontrado.")


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


def platform_stats() -> dict[str, Any]:
    """Métricas globales para el tablero del super-admin (cruza TODOS los negocios)."""
    from datetime import date
    from decimal import Decimal

    from django.db.models import Sum

    from apps.orders.models import Pedido

    tenants = Tenant.objects.all()
    total = tenants.count()
    activos = tenants.filter(activo=True).count()
    activos_ids = list(tenants.filter(activo=True).values_list("id", flat=True))
    vencidos = tenants.filter(proximo_cobro__lt=date.today()).count()

    # MRR = planes de negocios activos + add-ons activos (los suspendidos no pagan).
    # MRR (ingreso mensual equivalente): los planes anuales aportan precio/12; la prueba, 0.
    mrr = Decimal("0")
    for t in Tenant.objects.filter(id__in=activos_ids).select_related("plan"):
        if t.plan and t.plan.ciclo == "anual":
            mrr += t.plan.precio_base / 12
    mrr = mrr.quantize(Decimal("0.01"))

    # Ventas de toda la plataforma (sin cancelados), cruzando tenants.
    pedidos = Pedido.all_objects.exclude(estado="cancelado")
    ventas_total = pedidos.aggregate(s=Sum("total"))["s"] or Decimal("0")

    # Ventas por mes (últimos 6 meses) para la gráfica del tablero.
    import calendar as _cal

    y, m = date.today().year, date.today().month
    meses_ym: list[tuple[int, int]] = []
    for _ in range(6):
        meses_ym.append((y, m))
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    meses_ym.reverse()
    ventas_por_mes = [
        {
            "mes": f"{mm:02d}/{yy % 100:02d}",
            "total": str(pedidos.filter(creado__year=yy, creado__month=mm).aggregate(s=Sum("total"))["s"] or Decimal("0")),
        }
        for (yy, mm) in meses_ym
    ]

    # Por cobrar este mes (estimado): planes de negocios vencidos o que vencen este mes.
    hoy = date.today()
    fin_mes = date(hoy.year, hoy.month, _cal.monthrange(hoy.year, hoy.month)[1])
    por_cobrar = Decimal("0")
    for t in Tenant.objects.filter(proximo_cobro__isnull=False, proximo_cobro__lte=fin_mes).select_related("plan"):
        if t.plan:
            por_cobrar += t.plan.precio_base

    return {
        "negocios_total": total,
        "negocios_activos": activos,
        "negocios_suspendidos": total - activos,
        "negocios_vencidos": vencidos,
        "mrr": str(mrr),
        "ventas_total": str(ventas_total),
        "pedidos_total": pedidos.count(),
        "ventas_por_mes": ventas_por_mes,
        "por_cobrar_mes": str(por_cobrar),
    }
