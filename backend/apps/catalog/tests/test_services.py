from decimal import Decimal

import pytest
from rest_framework.exceptions import NotFound, ValidationError

from apps.accounts.tests.factories import TenantFactory
from apps.catalog.services import categoria_create, item_create, item_update
from apps.catalog.tests.factories import CategoriaFactory, ColeccionFactory, ItemFactory


@pytest.mark.django_db
def test_item_create_ok():
    cat = CategoriaFactory()
    item = item_create(
        tenant=cat.tenant, categoria_id=cat.id, nombre="Taco", precio=Decimal("30.00")
    )
    assert item.pk is not None
    assert item.tenant_id == cat.tenant_id


@pytest.mark.django_db
def test_item_create_rechaza_categoria_de_otro_negocio():
    categoria_ajena = CategoriaFactory()
    otro_tenant = TenantFactory()
    # categoria_get filtra por tenant -> no existe para 'otro_tenant' -> 404
    with pytest.raises(NotFound):
        item_create(
            tenant=otro_tenant, categoria_id=categoria_ajena.id,
            nombre="Robo", precio=Decimal("1.00"),
        )


@pytest.mark.django_db
def test_categoria_create_rechaza_coleccion_de_otro_negocio():
    coleccion_ajena = ColeccionFactory()
    otro_tenant = TenantFactory()
    with pytest.raises(NotFound):
        categoria_create(
            tenant=otro_tenant, coleccion_id=coleccion_ajena.id, nombre="X"
        )


@pytest.mark.django_db
def test_item_update_rechaza_campos_inmutables():
    item = ItemFactory()
    with pytest.raises(ValidationError):
        item_update(item=item, tenant_id=99999)


@pytest.mark.django_db
def test_item_create_como_paquete_con_etiqueta():
    cat = CategoriaFactory()
    item = item_create(
        tenant=cat.tenant, categoria_id=cat.id, nombre="Desayuno Canela",
        precio=Decimal("159.00"), etiqueta="Favorito", es_paquete=True,
        incluye=["Chilaquiles", "Fruta", "Café"],
    )
    assert item.es_paquete is True
    assert item.etiqueta == "Favorito"
    assert item.incluye == ["Chilaquiles", "Fruta", "Café"]
