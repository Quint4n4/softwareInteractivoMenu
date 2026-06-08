"""Lecturas de pedidos."""
from __future__ import annotations

from django.db.models import QuerySet
from rest_framework.exceptions import NotFound

from apps.accounts.models import Tenant

from .models import Pedido


def pedido_list(*, tenant: Tenant, estados: list[str] | None = None) -> QuerySet[Pedido]:
    qs = Pedido.all_objects.filter(tenant=tenant).prefetch_related("lineas__item__categoria__coleccion")
    if estados:
        qs = qs.filter(estado__in=estados)
    return qs.order_by("-creado")


def pedido_get(*, tenant: Tenant, pedido_id: int) -> Pedido:
    try:
        return Pedido.all_objects.prefetch_related("lineas__item__categoria__coleccion").get(tenant=tenant, id=pedido_id)
    except Pedido.DoesNotExist:
        raise NotFound("Pedido no encontrado.")


def pedido_get_by_numero(*, tenant: Tenant, numero: str) -> Pedido:
    try:
        return Pedido.all_objects.prefetch_related("lineas__item__categoria__coleccion").get(tenant=tenant, numero=numero)
    except Pedido.DoesNotExist:
        raise NotFound("Pedido no encontrado.")
