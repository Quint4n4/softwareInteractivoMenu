import factory
from django.contrib.auth import get_user_model

from apps.accounts.models import Tenant

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")


class TenantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tenant

    nombre = factory.Sequence(lambda n: f"Negocio {n}")
    slug = factory.Sequence(lambda n: f"negocio-{n}")
