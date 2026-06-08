import pytest
from rest_framework.test import APIClient


def _register(client, username, negocio):
    r = client.post(
        "/api/auth/register/",
        {"username": username, "email": f"{username}@x.com",
         "password": "clave1234", "nombre_negocio": negocio},
        format="json",
    )
    assert r.status_code == 201, r.data
    return r.data["tokens"]["access"], r.data["tenant"]["slug"]


def _auth(token):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Bearer " + token)
    return c


@pytest.mark.django_db
def test_flujo_panel_crea_menu_y_vitrina_publica():
    token, slug = _register(APIClient(), "ana", "Mariscos Ana")
    c = _auth(token)

    col = c.post("/api/colecciones/", {"tipo": "menu", "nombre": "Menú"}, format="json")
    assert col.status_code == 201, col.data
    cat = c.post("/api/categorias/", {"coleccion_id": col.data["id"], "nombre": "Entradas"}, format="json")
    assert cat.status_code == 201, cat.data
    it = c.post("/api/items/", {"categoria_id": cat.data["id"], "nombre": "Ceviche", "precio": "120.00"}, format="json")
    assert it.status_code == 201, it.data

    pub = APIClient().get(f"/api/public/{slug}/menu/")
    assert pub.status_code == 200
    assert pub.data["colecciones"][0]["categorias"][0]["items"][0]["nombre"] == "Ceviche"


@pytest.mark.django_db
def test_aislamiento_entre_tenants():
    token_a, _ = _register(APIClient(), "ana", "Mariscos Ana")
    token_b, _ = _register(APIClient(), "beto", "Tacos Beto")
    ca, cb = _auth(token_a), _auth(token_b)

    col = ca.post("/api/colecciones/", {"nombre": "Menú"}, format="json")
    cat = ca.post("/api/categorias/", {"coleccion_id": col.data["id"], "nombre": "Entradas"}, format="json")
    it = ca.post("/api/items/", {"categoria_id": cat.data["id"], "nombre": "Ceviche", "precio": "120.00"}, format="json")

    # Beto no ve los items de Ana
    lst = cb.get("/api/items/")
    assert lst.data["count"] == 0

    # Beto no puede ver el detalle de un item de Ana -> 404 (no 403)
    det = cb.get(f"/api/items/{it.data['id']}/")
    assert det.status_code == 404


@pytest.mark.django_db
def test_patch_no_cambia_disponible_pero_endpoint_explicito_si():
    token, _ = _register(APIClient(), "ana", "Mariscos Ana")
    c = _auth(token)
    col = c.post("/api/colecciones/", {"nombre": "Menú"}, format="json")
    cat = c.post("/api/categorias/", {"coleccion_id": col.data["id"], "nombre": "Cat"}, format="json")
    it = c.post("/api/items/", {"categoria_id": cat.data["id"], "nombre": "X", "precio": "10.00"}, format="json")
    item_id = it.data["id"]

    # PATCH intentando apagar 'disponible' -> se ignora (sigue disponible)
    r = c.patch(f"/api/items/{item_id}/", {"disponible": False, "nombre": "X2"}, format="json")
    assert r.status_code == 200
    assert r.data["disponible"] is True
    assert r.data["nombre"] == "X2"

    # Endpoint explícito sí cambia el estado
    r2 = c.post(f"/api/items/{item_id}/disponibilidad/", {"disponible": False}, format="json")
    assert r2.status_code == 200
    assert r2.data["disponible"] is False
