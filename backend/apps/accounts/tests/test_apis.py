import pytest
from rest_framework.test import APIClient


def _register(username="ana", negocio="Mariscos Ana"):
    c = APIClient()
    r = c.post(
        "/api/auth/register/",
        {"username": username, "email": f"{username}@x.com",
         "password": "clave1234", "nombre_negocio": negocio},
        format="json",
    )
    assert r.status_code == 201, r.data
    token = r.data["tokens"]["access"]
    auth = APIClient()
    auth.credentials(HTTP_AUTHORIZATION="Bearer " + token)
    return auth


@pytest.mark.django_db
def test_branding_get_y_patch():
    c = _register()

    r = c.get("/api/auth/branding/")
    assert r.status_code == 200
    assert r.data["negocio"]["nombre"] == "Mariscos Ana"
    assert "color_primario" in r.data["tema"]

    r2 = c.patch(
        "/api/auth/branding/",
        {
            "negocio": {"nombre": "Mariscos Ana 2", "modo_vitrina": "ambos"},
            "tema": {"color_primario": "#B95C3C", "tipografia": "Moderna"},
        },
        format="json",
    )
    assert r2.status_code == 200
    assert r2.data["negocio"]["nombre"] == "Mariscos Ana 2"
    assert r2.data["negocio"]["modo_vitrina"] == "ambos"
    assert r2.data["tema"]["color_primario"] == "#B95C3C"


@pytest.mark.django_db
def test_branding_ignora_slug_inmutable():
    c = _register()
    # 'slug' no está en el InputSerializer -> se ignora silenciosamente.
    r = c.patch("/api/auth/branding/", {"negocio": {"slug": "hackeado"}}, format="json")
    assert r.status_code == 200
    assert r.data["negocio"]["slug"] == "mariscos-ana"


@pytest.mark.django_db
def test_branding_requiere_negocio():
    # Sin autenticación -> 401
    assert APIClient().get("/api/auth/branding/").status_code == 401
