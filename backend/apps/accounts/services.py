"""Casos de uso de cuentas (escrituras)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils.text import slugify

from rest_framework.exceptions import ValidationError

from .models import Membership, Modulo, Plan, Tema, Tenant, TenantModulo

User = get_user_model()

# Caracteres legibles para contraseñas temporales (sin 0/O/1/l/I que confunden).
_PW_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz"

# Campos del negocio que no se cambian por un update genérico.
_TENANT_IMMUTABLE: frozenset[str] = frozenset(
    {"id", "slug", "activo", "plan", "creado", "actualizado"}
)
_TEMA_IMMUTABLE: frozenset[str] = frozenset({"id", "tenant", "tenant_id"})


def _unique_slug(base: str) -> str:
    slug, i = base, 2
    while Tenant.objects.filter(slug=slug).exists():
        slug = f"{base}-{i}"
        i += 1
    return slug


@transaction.atomic
def owner_register(
    *, username: str, email: str, password: str, nombre_negocio: str,
    slug: str | None = None,
) -> dict[str, Any]:
    """Crea de una vez: usuario dueño + negocio (tenant) + tema + membresía."""
    slug = _unique_slug(slug or slugify(nombre_negocio))
    user = User.objects.create_user(username=username, email=email, password=password)
    tenant = Tenant.objects.create(nombre=nombre_negocio, slug=slug)
    Tema.objects.create(tenant=tenant)
    Membership.objects.create(tenant=tenant, usuario=user, rol=Membership.Rol.OWNER)
    return {"user": user, "tenant": tenant}


def tenant_update(*, tenant: Tenant, **fields: Any) -> Tenant:
    """Ajustes del negocio (nombre, modo_vitrina, idiomas). El estado 'activo'
    y la identidad (slug/id) NO se tocan por aquí."""
    bad = set(fields) & _TENANT_IMMUTABLE
    if bad:
        raise ValidationError(f"No se pueden modificar los campos: {', '.join(sorted(bad))}.")
    for key, value in fields.items():
        setattr(tenant, key, value)
    tenant.full_clean(exclude=["plan"])
    tenant.save()
    return tenant


# ---------------- Plataforma (super-admin) ----------------
# Estos servicios cruzan negocios; las vistas que los usan exigen IsPlatformAdmin.
_TENANT_ADMIN_IMMUTABLE: frozenset[str] = frozenset(
    {"id", "slug", "activo", "creado", "actualizado"}
)


def tenant_suspend(*, tenant: Tenant) -> Tenant:
    """Suspende un negocio (estado explícito, NO por PATCH genérico)."""
    tenant.activo = False
    tenant.save(update_fields=["activo"])
    return tenant


def tenant_reactivate(*, tenant: Tenant) -> Tenant:
    tenant.activo = True
    tenant.save(update_fields=["activo"])
    return tenant


def _add_one_month(d: date) -> date:
    import calendar

    m, y = d.month + 1, d.year
    if m > 12:
        m, y = 1, y + 1
    return d.replace(year=y, month=m, day=min(d.day, calendar.monthrange(y, m)[1]))


def tenant_register_payment(*, tenant: Tenant) -> Tenant:
    """Registra un pago: adelanta el próximo cobro un mes y reactiva el negocio."""
    hoy = date.today()
    base = tenant.proximo_cobro if tenant.proximo_cobro and tenant.proximo_cobro > hoy else hoy
    tenant.proximo_cobro = _add_one_month(base)
    tenant.activo = True
    tenant.save(update_fields=["proximo_cobro", "activo"])
    return tenant


def tenant_reset_owner_password(*, tenant: Tenant) -> str:
    """Genera una contraseña temporal para el dueño del negocio (soporte) y la devuelve."""
    membership = (
        Membership.objects.filter(tenant=tenant, rol="owner")
        .select_related("usuario")
        .first()
    )
    if membership is None:
        raise ValidationError("Este negocio no tiene dueño.")
    password = get_random_string(10, _PW_ALPHABET)
    user = membership.usuario
    user.set_password(password)
    user.save(update_fields=["password"])
    return password


def tenant_admin_update(*, tenant: Tenant, **fields: Any) -> Tenant:
    """Ajustes de plataforma de un negocio: nombre, tipo, modo y plan.
    El estado 'activo' y la identidad (slug/id) NO se tocan por aquí."""
    bad = set(fields) & _TENANT_ADMIN_IMMUTABLE
    if bad:
        raise ValidationError(f"No se pueden modificar los campos: {', '.join(sorted(bad))}.")
    if "plan_id" in fields:
        plan_id = fields.pop("plan_id")
        if plan_id is None:
            tenant.plan = None
        else:
            try:
                tenant.plan = Plan.objects.get(id=plan_id)
            except Plan.DoesNotExist:
                raise ValidationError("El plan indicado no existe.")
    for key, value in fields.items():
        setattr(tenant, key, value)
    tenant.full_clean(exclude=["plan"])
    tenant.save()
    return tenant


def tenant_set_modulo(
    *, tenant: Tenant, clave: str, activo: bool, precio_aplicado: Decimal | None = None
) -> TenantModulo:
    """Activa/desactiva un módulo (add-on) para un negocio. Crea el TenantModulo
    si no existía. Al activar por primera vez sin precio, usa el precio del módulo."""
    try:
        modulo = Modulo.objects.get(clave=clave)
    except Modulo.DoesNotExist:
        raise ValidationError("El módulo indicado no existe.")
    tenant_modulo, created = TenantModulo.objects.get_or_create(
        tenant=tenant,
        modulo=modulo,
        defaults={
            "activo": activo,
            "precio_aplicado": precio_aplicado if precio_aplicado is not None else modulo.precio_addon,
        },
    )
    if not created:
        tenant_modulo.activo = activo
        if precio_aplicado is not None:
            tenant_modulo.precio_aplicado = precio_aplicado
        tenant_modulo.save(update_fields=["activo", "precio_aplicado"])
    return tenant_modulo


def tema_set_logo(*, tema: Tema, logo: Any) -> Tema:
    """Sube/reemplaza el logo del negocio. Con None lo elimina."""
    if tema.logo:
        tema.logo.delete(save=False)
    tema.logo = logo
    tema.save(update_fields=["logo"])
    return tema


def tema_update(*, tema: Tema, **fields: Any) -> Tema:
    bad = set(fields) & _TEMA_IMMUTABLE
    if bad:
        raise ValidationError(f"No se pueden modificar los campos: {', '.join(sorted(bad))}.")
    for key, value in fields.items():
        setattr(tema, key, value)
    tema.full_clean(exclude=["tenant", "logo", "portada"])
    tema.save()
    return tema
