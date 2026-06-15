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


def pedido_get_by_token(*, tenant: Tenant, token: str) -> Pedido:
    """Seguimiento público por token opaco. Rechaza tokens vacíos/cortos para no
    exponer pedidos antiguos sin token (defensa contra enumeración)."""
    if not token or len(token) < 10:
        raise NotFound("Pedido no encontrado.")
    try:
        return Pedido.all_objects.prefetch_related("lineas__item__categoria__coleccion").get(tenant=tenant, token=token)
    except Pedido.DoesNotExist:
        raise NotFound("Pedido no encontrado.")
