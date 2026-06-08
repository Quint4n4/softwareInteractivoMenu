import pytest
from rest_framework.exceptions import NotFound

from apps.accounts.tests.factories import TenantFactory
from apps.catalog.selectors import item_get, item_list
from apps.catalog.tests.factories import ItemFactory


@pytest.mark.django_db
def test_item_get_de_otro_tenant_lanza_404():
    item = ItemFactory()
    otro_tenant = TenantFactory()
    with pytest.raises(NotFound):
        item_get(tenant=otro_tenant, item_id=item.id)


@pytest.mark.django_db
def test_item_list_solo_devuelve_los_del_tenant():
    item = ItemFactory()
    ItemFactory()  # otro negocio
    qs = item_list(tenant=item.tenant)
    assert list(qs) == [item]
