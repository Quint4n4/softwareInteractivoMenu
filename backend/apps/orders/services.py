"""Casos de uso de pedidos (escrituras)."""
from __future__ import annotations

import secrets
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import Tenant
from apps.catalog.models import Item

from .models import Pedido, PedidoItem

# Minutos de preparación que se asumen cuando el platillo no tiene configurado
# ``tiempo_preparacion`` (fallback razonable para el cálculo de ETA).
_ETA_FALLBACK_MIN: int = 10

# Minutos adicionales por cada línea extra (más platillos distintos = más coordinación).
_ETA_EXTRA_POR_LINEA: int = 2


def _generar_numero(tenant: Tenant) -> str:
    n = Pedido.all_objects.filter(tenant=tenant).count() + 1
    return f"A-{n:03d}"


def _calcular_eta(lineas: list[tuple[Item, int, str]]) -> int:
    """Calcula el ETA del pedido en minutos.

    Fórmula: max(tiempo_preparacion de cada item, usando _ETA_FALLBACK_MIN cuando null)
    + _ETA_EXTRA_POR_LINEA * (número_de_líneas - 1).

    Args:
        lineas: Lista de tuplas (item, cantidad, notas).

    Returns:
        ETA estimado en minutos (entero ≥ 0).
    """
    if not lineas:
        return 0
    tiempos = [
        it.tiempo_preparacion if it.tiempo_preparacion is not None else _ETA_FALLBACK_MIN
        for it, _cantidad, _notas in lineas
    ]
    return max(tiempos) + _ETA_EXTRA_POR_LINEA * (len(lineas) - 1)


def _verificar_limites_diarios(
    *, tenant: Tenant, lineas: list[tuple[Item, int, str]]
) -> None:
    """Valida que ninguna línea supere el límite diario del platillo.

    Lanza ``ValidationError`` con un mensaje claro si se detecta que la cantidad
    solicitada, sumada a lo ya vendido hoy, excede el ``limite_diario`` del item.

    Usa UNA query agregada para todos los items con límite, evitando N+1.
    Solo se ejecuta ANTES de crear el Pedido (dentro de la transacción atómica).
    """
    items_con_limite = [(it, cantidad) for it, cantidad, _ in lineas if it.limite_diario is not None]
    if not items_con_limite:
        return

    hoy = timezone.localdate()
    ids_con_limite = [it.id for it, _ in items_con_limite]

    # Una sola query: suma vendida hoy por item_id, excluyendo cancelados.
    vendidos_rows = (
        PedidoItem.all_objects.filter(
            item_id__in=ids_con_limite,
            pedido__tenant=tenant,
            pedido__creado__date=hoy,
        )
        .exclude(pedido__estado=Pedido.Estado.CANCELADO)
        .values("item_id")
        .annotate(total_vendido=Sum("cantidad"))
    )
    vendidos: dict[int, int] = {row["item_id"]: row["total_vendido"] for row in vendidos_rows}

    for it, cantidad in items_con_limite:
        vendido_hoy = vendidos.get(it.id, 0)
        assert it.limite_diario is not None  # narrowing de tipo
        restante = it.limite_diario - vendido_hoy
        if vendido_hoy + cantidad > it.limite_diario:
            raise ValidationError(
                f"'{it.nombre}' ya casi se agota hoy (quedan {max(restante, 0)})."
            )


@transaction.atomic
def pedido_create(
    *, tenant: Tenant, nombre_cliente: str, telefono: str = "", tipo: str = Pedido.Tipo.MESA,
    mesa_texto: str = "", nota: str = "", metodo_pago: str = Pedido.MetodoPago.EFECTIVO,
    propina: Decimal | None = None, items: list[dict[str, Any]],
) -> Pedido:
    """Crea un pedido validando que los platillos sean del negocio y estén disponibles.

    El precio se toma del platillo actual (no se confía en el cliente).
    Antes de crear el pedido verifica los límites diarios por platillo.
    Calcula y guarda el ETA estimado en ``pedido.eta_min``.
    """
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

    # Verificar límites diarios ANTES de crear el pedido (dentro de la transacción).
    _verificar_limites_diarios(tenant=tenant, lineas=lineas)

    prop = Decimal(propina) if propina is not None else Decimal("0")
    if prop < 0:
        raise ValidationError("La propina no puede ser negativa.")

    eta = _calcular_eta(lineas)

    pedido = Pedido.objects.create(
        tenant=tenant, nombre_cliente=nombre_cliente, telefono=telefono, tipo=tipo,
        mesa_texto=mesa_texto, nota=nota, metodo_pago=metodo_pago,
        subtotal=total, propina=prop, total=total + prop,
        numero=_generar_numero(tenant), token=secrets.token_urlsafe(12),
        eta_min=eta,
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
