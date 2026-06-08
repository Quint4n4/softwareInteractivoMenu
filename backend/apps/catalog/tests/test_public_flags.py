"""Paso D: la vitrina pública respeta los flags del negocio
(suspendido, modo de negocio y módulo Catálogo)."""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Modulo, Tenant, TenantModulo
from apps.catalog.tests.factories import CategoriaFactory, ColeccionFactory, ItemFactory


def _tenant(slug: str = "demo-d", modo: str = "menu") -> Tenant:
    return Tenant.objects.create(nombre="Demo D", slug=slug, modo_vitrina=modo)


def _coleccion(tenant: Tenant, tipo: str, nombre: str) -> None:
    col = ColeccionFactory(tenant=tenant, tipo=tipo, nombre=nombre)
    cat = CategoriaFactory(coleccion=col, nombre=f"{nombre} cat")
    ItemFactory(categoria=cat, nombre=f"{nombre} item")


@pytest.mark.django_db
def test_negocio_suspendido_no_disponible() -> None:
    t = _tenant(modo="menu")
    _coleccion(t, "menu", "Menú")
    t.activo = False
    t.save(update_fields=["activo"])

    r = APIClient().get(f"/api/public/{t.slug}/menu/")
    assert r.status_code == 200
    assert r.data["disponible"] is False
    assert r.data["colecciones"] == []


@pytest.mark.django_db
def test_modo_menu_oculta_el_catalogo() -> None:
    t = _tenant(modo="menu")
    _coleccion(t, "menu", "Menú")
    _coleccion(t, "catalogo", "Tienda")

    r = APIClient().get(f"/api/public/{t.slug}/menu/")
    assert r.status_code == 200
    assert {c["tipo"] for c in r.data["colecciones"]} == {"menu"}


@pytest.mark.django_db
def test_modo_ambos_sin_modulo_no_muestra_catalogo() -> None:
    t = _tenant(modo="ambos")
    _coleccion(t, "menu", "Menú")
    _coleccion(t, "catalogo", "Tienda")

    r = APIClient().get(f"/api/public/{t.slug}/menu/")
    # El Catálogo está oculto porque su módulo no está activo.
    assert {c["tipo"] for c in r.data["colecciones"]} == {"menu"}


@pytest.mark.django_db
def test_modo_ambos_con_modulo_muestra_ambos() -> None:
    t = _tenant(modo="ambos")
    _coleccion(t, "menu", "Menú")
    _coleccion(t, "catalogo", "Tienda")
    modulo = Modulo.objects.create(clave=Modulo.Clave.CATALOGO, nombre="Catálogo")
    TenantModulo.objects.create(tenant=t, modulo=modulo, activo=True)

    r = APIClient().get(f"/api/public/{t.slug}/menu/")
    assert {c["tipo"] for c in r.data["colecciones"]} == {"menu", "catalogo"}
    assert "catalogo" in r.data["modulos"]
