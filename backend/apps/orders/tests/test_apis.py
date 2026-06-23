from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Tenant
from apps.catalog.models import Categoria, Coleccion, Item


def _setup():
    c = APIClient()
    r = c.post(
        "/api/auth/register/",
        {"username": "ana", "email": "ana@x.com", "password": "clave1234", "nombre_negocio": "Mariscos Ana"},
        format="json",
    )
    assert r.status_code == 201, r.data
    slug = r.data["tenant"]["slug"]
    tenant = Tenant.objects.get(slug=slug)
    col = Coleccion.objects.create(tenant=tenant, tipo="menu", nombre="Menú")
    cat = Categoria.objects.create(tenant=tenant, coleccion=col, nombre="Entradas")
    item = Item.objects.create(tenant=tenant, categoria=cat, nombre="Ceviche", precio=Decimal("30"))
    auth = APIClient()
    auth.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["tokens"]["access"])
    return slug, item, auth


@pytest.mark.django_db
def test_flujo_pedido_completo():
    slug, item, auth = _setup()
    pub = APIClient()

    r = pub.post(
        f"/api/public/{slug}/pedidos/",
        {"nombre_cliente": "Diego", "tipo": "mesa", "mesa_texto": "5",
         "items": [{"item_id": item.id, "cantidad": 2}]},
        format="json",
    )
    assert r.status_code == 201, r.data
    token = r.data["token"]
    assert float(r.data["total"]) == 60.0
    assert r.data["estado"] == "nuevo"

    # seguimiento público (por token opaco, no por número)
    t = pub.get(f"/api/public/{slug}/pedidos/{token}/")
    assert t.status_code == 200 and t.data["estado"] == "nuevo"

    # panel: listar y avanzar estado
    lst = auth.get("/api/pedidos/")
    assert lst.status_code == 200 and len(lst.data) == 1
    pid = lst.data[0]["id"]
    e = auth.post(f"/api/pedidos/{pid}/estado/", {"estado": "en_proceso"}, format="json")
    assert e.status_code == 200 and e.data["estado"] == "en_proceso"


@pytest.mark.django_db
def test_pedido_rechaza_item_de_otro_negocio():
    slug, _item, _auth = _setup()
    otro = Tenant.objects.create(nombre="Otro", slug="otro")
    col = Coleccion.objects.create(tenant=otro, tipo="menu", nombre="M")
    cat = Categoria.objects.create(tenant=otro, coleccion=col, nombre="C")
    ajeno = Item.objects.create(tenant=otro, categoria=cat, nombre="Ajeno", precio=Decimal("10"))

    r = APIClient().post(
        f"/api/public/{slug}/pedidos/",
        {"nombre_cliente": "Y", "items": [{"item_id": ajeno.id, "cantidad": 1}]},
        format="json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_listar_pedidos_requiere_negocio():
    assert APIClient().get("/api/pedidos/").status_code == 401


@pytest.mark.django_db
def test_origen_del_pedido_menu_catalogo_mixto():
    slug, item_menu, auth = _setup()
    tenant = Tenant.objects.get(slug=slug)
    colc = Coleccion.objects.create(tenant=tenant, tipo="catalogo", nombre="Tienda")
    catc = Categoria.objects.create(tenant=tenant, coleccion=colc, nombre="Granos")
    item_cat = Item.objects.create(tenant=tenant, categoria=catc, nombre="Café 250g", precio=Decimal("180"))
    pub = APIClient()

    pub.post(f"/api/public/{slug}/pedidos/",
             {"nombre_cliente": "A", "tipo": "llevar", "items": [{"item_id": item_cat.id, "cantidad": 1}]},
             format="json")
    pub.post(f"/api/public/{slug}/pedidos/",
             {"nombre_cliente": "B", "tipo": "mesa", "items": [{"item_id": item_menu.id, "cantidad": 1}]},
             format="json")
    pub.post(f"/api/public/{slug}/pedidos/",
             {"nombre_cliente": "C", "tipo": "llevar",
              "items": [{"item_id": item_cat.id, "cantidad": 1}, {"item_id": item_menu.id, "cantidad": 1}]},
             format="json")

    lst = auth.get("/api/pedidos/")
    assert lst.status_code == 200
    origen = {p["nombre_cliente"]: p["origen"] for p in lst.data}
    assert origen["A"] == "catalogo"
    assert origen["B"] == "menu"
    assert origen["C"] == "mixto"
