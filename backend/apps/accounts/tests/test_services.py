import pytest

from apps.accounts.models import Membership, Tenant
from apps.accounts.services import owner_register


@pytest.mark.django_db
def test_owner_register_crea_usuario_tenant_y_membresia():
    result = owner_register(
        username="ana", email="ana@x.com", password="clave1234",
        nombre_negocio="Mariscos Ana",
    )
    assert result["tenant"].slug == "mariscos-ana"
    assert Membership.objects.filter(
        tenant=result["tenant"], usuario=result["user"], rol=Membership.Rol.OWNER
    ).exists()


@pytest.mark.django_db
def test_owner_register_genera_slug_unico():
    owner_register(username="a", email="a@x.com", password="clave1234", nombre_negocio="Tacos")
    r2 = owner_register(username="b", email="b@x.com", password="clave1234", nombre_negocio="Tacos")
    assert r2["tenant"].slug == "tacos-2"
    assert Tenant.objects.filter(slug__startswith="tacos").count() == 2
