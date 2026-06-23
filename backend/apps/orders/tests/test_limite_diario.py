"""Tests del límite diario (feature B) y del ETA (feature A) en pedido_create."""
from decimal import Decimal

import pytest
from rest_framework.exceptions import ValidationError

from apps.catalog.tests.factories import CategoriaFactory, ItemFactory
from apps.orders.models import Pedido, PedidoItem
from apps.orders.services import _calcular_eta, pedido_create


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _linea(item, cantidad: int = 1, notas: str = "") -> tuple:
    return (item, cantidad, notas)


# ---------------------------------------------------------------------------
# ETA (feature A)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_eta_un_solo_item_con_tiempo():
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, tiempo_preparacion=15)
    lineas = [_linea(item, 1)]
    # 1 línea → eta = max(15) + 2*(1-1) = 15
    assert _calcular_eta(lineas) == 15


@pytest.mark.django_db
def test_eta_usa_fallback_cuando_null():
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, tiempo_preparacion=None)
    lineas = [_linea(item, 2)]
    # 1 línea → eta = max(10) + 0 = 10  (10 es el fallback)
    assert _calcular_eta(lineas) == 10


@pytest.mark.django_db
def test_eta_varias_lineas():
    cat = CategoriaFactory()
    item_a = ItemFactory(categoria=cat, tiempo_preparacion=20)
    item_b = ItemFactory(categoria=cat, tiempo_preparacion=5)
    lineas = [_linea(item_a), _linea(item_b)]
    # 2 líneas → eta = max(20, 5) + 2*(2-1) = 20 + 2 = 22
    assert _calcular_eta(lineas) == 22


@pytest.mark.django_db
def test_pedido_guarda_eta_min():
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, precio=Decimal("50"), tiempo_preparacion=12)
    pedido = pedido_create(
        tenant=cat.tenant,
        nombre_cliente="Test",
        items=[{"item_id": item.id, "cantidad": 1}],
    )
    assert pedido.eta_min == 12


# ---------------------------------------------------------------------------
# Límite diario (feature B)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_limite_diario_permite_hasta_el_limite():
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, precio=Decimal("30"), limite_diario=5)
    # Primer pedido de 5 unidades — debe pasar.
    pedido = pedido_create(
        tenant=cat.tenant,
        nombre_cliente="Cliente A",
        items=[{"item_id": item.id, "cantidad": 5}],
    )
    assert pedido.pk is not None


@pytest.mark.django_db
def test_limite_diario_rechaza_cuando_se_excede():
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, precio=Decimal("30"), limite_diario=3)
    # Primer pedido consume 2 unidades.
    pedido_create(
        tenant=cat.tenant,
        nombre_cliente="Cliente A",
        items=[{"item_id": item.id, "cantidad": 2}],
    )
    # Segundo pedido intenta 2 más (total 4 > límite 3).
    with pytest.raises(ValidationError) as exc_info:
        pedido_create(
            tenant=cat.tenant,
            nombre_cliente="Cliente B",
            items=[{"item_id": item.id, "cantidad": 2}],
        )
    assert "agota" in str(exc_info.value).lower()
    assert "quedan" in str(exc_info.value).lower()


@pytest.mark.django_db
def test_limite_diario_null_no_bloquea():
    """Items sin límite diario siempre se pueden pedir."""
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, precio=Decimal("30"), limite_diario=None)
    for _ in range(10):
        pedido_create(
            tenant=cat.tenant,
            nombre_cliente="Cliente X",
            items=[{"item_id": item.id, "cantidad": 5}],
        )


@pytest.mark.django_db
def test_limite_diario_excluye_pedidos_cancelados():
    """Los pedidos cancelados no cuentan contra el límite diario."""
    cat = CategoriaFactory()
    item = ItemFactory(categoria=cat, precio=Decimal("30"), limite_diario=5)
    # Crear un pedido y luego cancelarlo.
    p = pedido_create(
        tenant=cat.tenant,
        nombre_cliente="Cliente A",
        items=[{"item_id": item.id, "cantidad": 5}],
    )
    p.estado = Pedido.Estado.CANCELADO
    p.save(update_fields=["estado"])

    # Ahora debe poder pedirse 5 de nuevo (el cancelado no cuenta).
    pedido2 = pedido_create(
        tenant=cat.tenant,
        nombre_cliente="Cliente B",
        items=[{"item_id": item.id, "cantidad": 5}],
    )
    assert pedido2.pk is not None


@pytest.mark.django_db
def test_limite_diario_aislado_por_tenant():
    """El límite de un tenant NO afecta al otro tenant."""
    cat_a = CategoriaFactory()
    cat_b = CategoriaFactory()
    # Dos items del MISMO nombre pero en tenants distintos, mismo limite_diario.
    item_a = ItemFactory(categoria=cat_a, precio=Decimal("30"), limite_diario=2)
    item_b = ItemFactory(categoria=cat_b, precio=Decimal("30"), limite_diario=2)

    # Agotar el item del tenant A.
    pedido_create(
        tenant=cat_a.tenant,
        nombre_cliente="Cliente A",
        items=[{"item_id": item_a.id, "cantidad": 2}],
    )
    # El tenant B no debería verse afectado.
    pedido_b = pedido_create(
        tenant=cat_b.tenant,
        nombre_cliente="Cliente B",
        items=[{"item_id": item_b.id, "cantidad": 2}],
    )
    assert pedido_b.pk is not None
