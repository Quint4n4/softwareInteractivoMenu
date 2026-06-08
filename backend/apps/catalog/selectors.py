"""Lecturas del catálogo. Toda lectura por id pasa por aquí (evita IDOR)."""
from __future__ import annotations

from django.db.models import QuerySet
from rest_framework.exceptions import NotFound

from apps.accounts.models import Modulo, Tenant
from apps.accounts.selectors import tenant_has_modulo

from .models import Categoria, Coleccion, Item, Variante


# --------------------------- Colección ---------------------------
def coleccion_list(*, tenant: Tenant) -> QuerySet[Coleccion]:
    return Coleccion.all_objects.filter(tenant=tenant).order_by("orden")


def coleccion_get(*, tenant: Tenant, coleccion_id: int) -> Coleccion:
    try:
        return Coleccion.all_objects.get(tenant=tenant, id=coleccion_id)
    except Coleccion.DoesNotExist:
        raise NotFound("Colección no encontrada.")


# --------------------------- Categoría ---------------------------
def categoria_list(*, tenant: Tenant) -> QuerySet[Categoria]:
    return (
        Categoria.all_objects.filter(tenant=tenant)
        .select_related("coleccion")
        .order_by("orden")
    )


def categoria_get(*, tenant: Tenant, categoria_id: int) -> Categoria:
    try:
        return Categoria.all_objects.get(tenant=tenant, id=categoria_id)
    except Categoria.DoesNotExist:
        raise NotFound("Categoría no encontrada.")


# ----------------------------- Item ------------------------------
def item_list(*, tenant: Tenant) -> QuerySet[Item]:
    return (
        Item.all_objects.filter(tenant=tenant)
        .select_related("categoria")
        .prefetch_related("variantes")
        .order_by("orden")
    )


def item_get(*, tenant: Tenant, item_id: int) -> Item:
    try:
        return Item.all_objects.prefetch_related("variantes").get(
            tenant=tenant, id=item_id
        )
    except Item.DoesNotExist:
        raise NotFound("Item no encontrado.")


# --------------------------- Variante ----------------------------
def variante_list(*, tenant: Tenant) -> QuerySet[Variante]:
    return Variante.all_objects.filter(tenant=tenant).select_related("item")


def variante_get(*, tenant: Tenant, variante_id: int) -> Variante:
    try:
        return Variante.all_objects.get(tenant=tenant, id=variante_id)
    except Variante.DoesNotExist:
        raise NotFound("Variante no encontrada.")


# --------------------- Vitrina pública (por slug) ----------------
def public_tenant(*, slug: str) -> Tenant | None:
    """Negocio por slug, INCLUYE suspendidos (la vista decide qué mostrar)."""
    return Tenant.objects.select_related("tema").filter(slug=slug).first()


def public_colecciones_for(*, tenant: Tenant) -> list[Coleccion]:
    """Colecciones visibles según el modo del negocio y sus módulos activos.

    - Menú: visible si el modo lo incluye (es la base del producto).
    - Catálogo: visible solo si el modo lo incluye Y el módulo 'catalogo' está
      activo (es un add-on de pago).
    """
    tipos: list[str] = []
    if tenant.modo_vitrina in (Tenant.ModoVitrina.MENU, Tenant.ModoVitrina.AMBOS):
        tipos.append(Coleccion.Tipo.MENU)
    if tenant.modo_vitrina in (Tenant.ModoVitrina.CATALOGO, Tenant.ModoVitrina.AMBOS):
        if tenant_has_modulo(tenant=tenant, clave=Modulo.Clave.CATALOGO):
            tipos.append(Coleccion.Tipo.CATALOGO)
    if not tipos:
        return []
    return list(
        Coleccion.all_objects.filter(tenant=tenant, activo=True, tipo__in=tipos)
        .prefetch_related("categorias__items__variantes")
        .order_by("orden")
    )
