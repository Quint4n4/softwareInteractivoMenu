from decimal import Decimal

import factory

from apps.accounts.tests.factories import TenantFactory
from apps.catalog.models import Categoria, Coleccion, Item


class ColeccionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Coleccion

    tenant = factory.SubFactory(TenantFactory)
    tipo = Coleccion.Tipo.MENU
    nombre = "Menú principal"


class CategoriaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Categoria

    coleccion = factory.SubFactory(ColeccionFactory)
    # La categoría hereda el tenant de su colección (coherencia multi-tenant).
    tenant = factory.SelfAttribute("coleccion.tenant")
    nombre = "Entradas"


class ItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Item

    categoria = factory.SubFactory(CategoriaFactory)
    tenant = factory.SelfAttribute("categoria.tenant")
    nombre = "Ceviche"
    precio = Decimal("120.00")
