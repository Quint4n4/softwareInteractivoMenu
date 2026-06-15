"""Casos de uso de pedidos (escrituras)."""
from __future__ import annotations

import secrets
from decimal import Decimal
from typing import Any

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Tenant
from apps.catalog.models import Item

from .models import Pedido, PedidoItem


def _generar_numero(tenant: Tenant) -> str:
    n = Pedido.all_objects.filter(tenant=tenant).count() + 1
    return f"A-{n:03d}"


@transaction.atomic
def pedido_create(
    *, tenant: Tenant, nombre_cliente: str, telefono: str = "", tipo: str = Pedido.Tipo.MESA,
    mesa_texto: str = "", nota: str = "", metodo_pago: str = Pedido.MetodoPago.EFECTIVO,
    propina: Decimal | None = None, items: list[dict[str, Any]],
) -> Pedido:
    """Crea un pedido validando que los platillos sean del negocio y estén disponibles.
    El precio se toma del platillo actual (no se confía en el cliente)."""
    if not items:
        raise ValidationError("El pedido no tiene platillos.")

    ids = [i["item_id"] for i in items]
    disponibles = {
        it.id: it for it in Item.all_objects.filter(tenant=tenant, id__in=ids, disponible=True)
    }

    lineas: list[tuple[Item, int, str]] = []
    total = Decimal("0")
    for i in items:
        it = disponibles.get(i["item_id"])
        if it is None:
            raise ValidationError(f"Un platillo no está disponible (id {i['item_id']}).")
        cantidad = int(i.get("cantidad", 1))
        if cantidad < 1:
            continue
        total += it.precio * cantidad
        lineas.append((it, cantidad, i.get("notas", "")))

    if not lineas:
        raise ValidationError("El pedido no tiene platillos válidos.")

    prop = Decimal(propina) if propina is not None else Decimal("0")
    if prop < 0:
        raise ValidationError("La propina no puede ser negativa.")

    pedido = Pedido.objects.create(
        tenant=tenant, nombre_cliente=nombre_cliente, telefono=telefono, tipo=tipo,
        mesa_texto=mesa_texto, nota=nota, metodo_pago=metodo_pago,
        subtotal=total, propina=prop, total=total + prop,
        numero=_generar_numero(tenant), token=secrets.token_urlsafe(12),
    )
    for it, cantidad, notas in lineas:
        PedidoItem.objects.create(
            tenant=tenant, pedido=pedido, item=it,
            cantidad=cantidad, precio_unitario=it.precio, notas=notas,
        )
    return pedido


def pedido_set_estado(*, pedido: Pedido, estado: str) -> Pedido:
    valid = {c[0] for c in Pedido.Estado.choices}
    if estado not in valid:
        raise ValidationError("Estado inválido.")
    pedido.estado = estado
    pedido.save(update_fields=["estado", "actualizado"])
    return pedido
