"""Pruebas del panel de plataforma (super-admin). El foco de seguridad:
un dueño normal NUNCA debe poder operar por encima de otros negocios.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Modulo, Plan, Tenant, TenantModulo

User = get_user_model()


def _register_owner(username: str = "ana", negocio: str = "Negocio A") -> APIClient:
    """Registra un dueño NORMAL (no super-admin) y devuelve su client autenticado."""
    c = APIClient()
    r = c.post(
        "/api/auth/register/",
        {"username": username, "email": f"{username}@x.com",
         "password": "clave1234", "nombre_negocio": negocio},
        format="json",
    )
    assert r.status_code == 201, r.data
    auth = APIClient()
    auth.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["tokens"]["access"])
    return auth


def _admin_client() -> APIClient:
    """Crea un super-admin y devuelve un client autenticado con su token."""
    admin = User.objects.create_superuser(
        username="root", email="root@x.com", password="clave1234"
    )
    token = str(RefreshToken.for_user(admin).access_token)
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Bearer " + token)
    return c


@pytest.mark.django_db
def test_panel_plataforma_sin_auth_da_401() -> None:
    assert APIClient().get("/api/admin/negocios/").status_code == 401


@pytest.mark.django_db
def test_owner_normal_no_puede_entrar_al_panel() -> None:
    owner = _register_owner()
    assert owner.get("/api/admin/negocios/").status_code == 403


@pytest.mark.django_db
def test_admin_lista_todos_los_negocios() -> None:
    _register_owner("ana", "Negocio A")
    _register_owner("luis", "Negocio B")
    c = _admin_client()
    r = c.get("/api/admin/negocios/")
    assert r.status_code == 200
    nombres = {t["nombre"] for t in r.data["results"]}
    assert {"Negocio A", "Negocio B"} <= nombres


@pytest.mark.django_db
def test_admin_da_de_alta_un_negocio() -> None:
    c = _admin_client()
    r = c.post(
        "/api/admin/negocios/",
        {"username": "nuevo", "email": "n@x.com",
         "password": "clave1234", "nombre_negocio": "Café Nuevo"},
        format="json",
    )
    assert r.status_code == 201, r.data
    assert r.data["nombre"] == "Café Nuevo"
    assert r.data["owner_email"] == "n@x.com"
    assert Tenant.objects.filter(nombre="Café Nuevo").exists()


@pytest.mark.django_db
def test_admin_suspende_y_reactiva() -> None:
    _register_owner("ana", "Negocio A")
    tenant = Tenant.objects.get(nombre="Negocio A")
    c = _admin_client()

    r = c.post(f"/api/admin/negocios/{tenant.id}/suspender/")
    assert r.status_code == 200 and r.data["activo"] is False
    tenant.refresh_from_db()
    assert tenant.activo is False

    r2 = c.post(f"/api/admin/negocios/{tenant.id}/reactivar/")
    assert r2.status_code == 200 and r2.data["activo"] is True


@pytest.mark.django_db
def test_admin_asigna_plan() -> None:
    _register_owner("ana", "Negocio A")
    tenant = Tenant.objects.get(nombre="Negocio A")
    plan = Plan.objects.create(nombre="Pro", precio_base="199.00")
    c = _admin_client()

    r = c.patch(f"/api/admin/negocios/{tenant.id}/", {"plan_id": plan.id}, format="json")
    assert r.status_code == 200
    assert r.data["plan_nombre"] == "Pro"


@pytest.mark.django_db
def test_patch_no_puede_cambiar_estado_activo() -> None:
    # 'activo' no está en el InputSerializer -> se ignora; el negocio sigue activo.
    _register_owner("ana", "Negocio A")
    tenant = Tenant.objects.get(nombre="Negocio A")
    c = _admin_client()
    r = c.patch(f"/api/admin/negocios/{tenant.id}/", {"activo": False}, format="json")
    assert r.status_code == 200
    assert r.data["activo"] is True


@pytest.mark.django_db
def test_negocio_inexistente_da_404() -> None:
    c = _admin_client()
    r = c.get("/api/admin/negocios/00000000-0000-0000-0000-000000000000/")
    assert r.status_code == 404


# ----------------------- Módulos / add-ons (Paso C) -----------------------
def _modulo_catalogo() -> Modulo:
    return Modulo.objects.create(
        clave=Modulo.Clave.CATALOGO, nombre="Catálogo de productos", precio_addon="199.00"
    )


@pytest.mark.django_db
def test_owner_no_puede_ver_modulos() -> None:
    owner = _register_owner()
    assert owner.get("/api/admin/modulos/").status_code == 403


@pytest.mark.django_db
def test_admin_lista_catalogo_de_modulos() -> None:
    _modulo_catalogo()
    c = _admin_client()
    r = c.get("/api/admin/modulos/")
    assert r.status_code == 200
    assert "catalogo" in {m["clave"] for m in r.data}


@pytest.mark.django_db
def test_admin_activa_y_desactiva_modulo_de_un_negocio() -> None:
    _register_owner("ana", "Negocio A")
    tenant = Tenant.objects.get(nombre="Negocio A")
    _modulo_catalogo()
    c = _admin_client()

    # Estado inicial: el Catálogo aparece pero inactivo.
    r = c.get(f"/api/admin/negocios/{tenant.id}/modulos/")
    assert r.status_code == 200
    cat = next(m for m in r.data if m["clave"] == "catalogo")
    assert cat["activo"] is False

    # Activar con una "casilla".
    r2 = c.post(
        f"/api/admin/negocios/{tenant.id}/modulos/",
        {"clave": "catalogo", "activo": True}, format="json",
    )
    assert r2.status_code == 200
    cat2 = next(m for m in r2.data if m["clave"] == "catalogo")
    assert cat2["activo"] is True
    assert TenantModulo.objects.filter(
        tenant=tenant, modulo__clave="catalogo", activo=True
    ).exists()

    # Desactivar.
    r3 = c.post(
        f"/api/admin/negocios/{tenant.id}/modulos/",
        {"clave": "catalogo", "activo": False}, format="json",
    )
    cat3 = next(m for m in r3.data if m["clave"] == "catalogo")
    assert cat3["activo"] is False


@pytest.mark.django_db
def test_owner_no_puede_togglear_modulos() -> None:
    owner = _register_owner("ana", "Negocio A")
    tenant = Tenant.objects.get(nombre="Negocio A")
    _modulo_catalogo()
    r = owner.post(
        f"/api/admin/negocios/{tenant.id}/modulos/",
        {"clave": "catalogo", "activo": True}, format="json",
    )
    assert r.status_code == 403


# ----------------------- Paso F: sello de aislamiento -----------------------
@pytest.mark.django_db
def test_owner_no_puede_usar_NINGUN_endpoint_de_plataforma() -> None:
    """Un dueño normal recibe 403 en TODA la superficie del panel de plataforma."""
    owner = _register_owner("ana", "Negocio A")
    tid = str(Tenant.objects.get(nombre="Negocio A").id)

    # Lecturas
    assert owner.get("/api/admin/negocios/").status_code == 403
    assert owner.get("/api/admin/planes/").status_code == 403
    assert owner.get("/api/admin/modulos/").status_code == 403
    assert owner.get(f"/api/admin/negocios/{tid}/").status_code == 403
    assert owner.get(f"/api/admin/negocios/{tid}/modulos/").status_code == 403

    # Escrituras
    alta = owner.post(
        "/api/admin/negocios/",
        {"username": "z", "email": "z@x.com", "password": "clave1234", "nombre_negocio": "Z"},
        format="json",
    )
    assert alta.status_code == 403
    assert owner.post(f"/api/admin/negocios/{tid}/suspender/").status_code == 403
    assert owner.post(f"/api/admin/negocios/{tid}/reactivar/").status_code == 403
    assert owner.patch(f"/api/admin/negocios/{tid}/", {"nombre": "hack"}, format="json").status_code == 403
    assert owner.post(
        f"/api/admin/negocios/{tid}/modulos/",
        {"clave": "catalogo", "activo": True}, format="json",
    ).status_code == 403


@pytest.mark.django_db
def test_sin_sesion_todos_los_endpoints_dan_401() -> None:
    c = APIClient()
    assert c.get("/api/admin/negocios/").status_code == 401
    assert c.get("/api/admin/planes/").status_code == 401
    assert c.get("/api/admin/modulos/").status_code == 401
    assert c.post("/api/admin/negocios/", {}, format="json").status_code == 401


@pytest.mark.django_db
def test_un_dueno_no_puede_suspender_el_negocio_de_otro() -> None:
    owner_a = _register_owner("ana", "Negocio A")
    _register_owner("beto", "Negocio B")
    negocio_b = Tenant.objects.get(nombre="Negocio B")

    r = owner_a.post(f"/api/admin/negocios/{negocio_b.id}/suspender/")
    assert r.status_code == 403
    negocio_b.refresh_from_db()
    assert negocio_b.activo is True  # intacto: nadie ajeno lo tocó
