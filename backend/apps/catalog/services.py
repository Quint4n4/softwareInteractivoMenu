"""Escrituras del catálogo. Aquí vive la lógica de negocio (no en views/serializers)."""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from rest_framework.exceptions import ValidationError

from apps.accounts.models import Tenant
from django.contrib.auth.models import AbstractBaseUser

from .models import Categoria, Coleccion, Item, Variante
from .selectors import categoria_get, coleccion_get, item_get

User = AbstractBaseUser

# Campos que NUNCA se cambian por un update genérico.
_IMMUTABLE_FIELDS: frozenset[str] = frozenset(
    {"id", "tenant", "tenant_id", "creado", "actualizado"}
)


def _reject_immutable(fields: dict[str, Any]) -> None:
    bad = set(fields) & _IMMUTABLE_FIELDS
    if bad:
        raise ValidationError(
            f"No se pueden modificar los campos: {', '.join(sorted(bad))}."
        )


def _apply(obj: Any, fields: dict[str, Any]) -> Any:
    for key, value in fields.items():
        setattr(obj, key, value)
    obj.full_clean(exclude=["tenant"])
    obj.save()
    return obj


# --------------------------- Colección ---------------------------
def coleccion_create(
    *, tenant: Tenant, tipo: str = Coleccion.Tipo.MENU, nombre: str, orden: int = 0
) -> Coleccion:
    coleccion = Coleccion(tenant=tenant, tipo=tipo, nombre=nombre, orden=orden)
    coleccion.full_clean(exclude=["tenant"])
    coleccion.save()
    return coleccion


def coleccion_update(*, coleccion: Coleccion, **fields: Any) -> Coleccion:
    _reject_immutable(fields)
    return _apply(coleccion, fields)


def coleccion_delete(*, coleccion: Coleccion) -> None:
    coleccion.delete()


# --------------------------- Categoría ---------------------------
def categoria_create(
    *, tenant: Tenant, coleccion_id: int, nombre: str, orden: int = 0,
    i18n: dict[str, Any] | None = None,
) -> Categoria:
    coleccion = coleccion_get(tenant=tenant, coleccion_id=coleccion_id)
    if coleccion.tenant_id != tenant.id:  # defensa en profundidad
        raise ValidationError("La colección no pertenece a este negocio.")
    categoria = Categoria(
        tenant=tenant, coleccion=coleccion, nombre=nombre, orden=orden, i18n=i18n or {}
    )
    categoria.full_clean(exclude=["tenant"])
    categoria.save()
    return categoria


def categoria_update(*, categoria: Categoria, **fields: Any) -> Categoria:
    _reject_immutable(fields)
    if "coleccion" in fields or "coleccion_id" in fields:
        raise ValidationError("La colección de una categoría no se reasigna por update.")
    return _apply(categoria, fields)


def categoria_delete(*, categoria: Categoria) -> None:
    categoria.delete()


# ----------------------------- Item ------------------------------
def item_create(
    *, tenant: Tenant, categoria_id: int, nombre: str, precio: Decimal,
    descripcion: str = "", moneda: str = "MXN", etiqueta: str = "",
    es_paquete: bool = False, incluye: list[str] | None = None,
    sku: str = "", stock: int | None = None, orden: int = 0,
    i18n: dict[str, Any] | None = None,
    tiempo_preparacion: int | None = None,
    limite_diario: int | None = None,
) -> Item:
    """Crea un platillo/producto en el catálogo del negocio.

    Args:
        tiempo_preparacion: Minutos estimados de preparación (None = no configurado).
        limite_diario: Máximo de unidades vendibles por día (None = sin límite).
    """
    categoria = categoria_get(tenant=tenant, categoria_id=categoria_id)
    if categoria.tenant_id != tenant.id:  # defensa en profundidad
        raise ValidationError("La categoría no pertenece a este negocio.")
    item = Item(
        tenant=tenant, categoria=categoria, nombre=nombre, precio=precio,
        descripcion=descripcion, moneda=moneda, etiqueta=etiqueta,
        es_paquete=es_paquete, incluye=incluye or [], sku=sku, stock=stock,
        orden=orden, i18n=i18n or {},
        tiempo_preparacion=tiempo_preparacion,
        limite_diario=limite_diario,
    )
    item.full_clean(exclude=["tenant"])
    item.save()
    return item


def item_update(*, item: Item, **fields: Any) -> Item:
    _reject_immutable(fields)
    # Reasignar categoría sí se permite, pero validando tenant.
    if "categoria" in fields:
        categoria = fields["categoria"]
        if categoria.tenant_id != item.tenant_id:
            raise ValidationError("La categoría no pertenece a este negocio.")
    return _apply(item, fields)


def item_set_disponibilidad(*, item: Item, disponible: bool) -> Item:
    """Endpoint/servicio explícito para cambiar estado (no por PATCH genérico)."""
    item.disponible = disponible
    item.save(update_fields=["disponible", "actualizado"])
    return item


def item_set_imagen(*, item: Item, imagen: Any) -> Item:
    """Asigna la foto del platillo (subida desde el panel del dueño)."""
    item.imagen = imagen
    item.save(update_fields=["imagen", "actualizado"])
    return item


def item_delete(*, item: Item) -> None:
    item.delete()


# --------------------------- Variante ----------------------------
def variante_create(
    *, tenant: Tenant, item_id: int, nombre: str, precio_extra: Decimal = Decimal("0")
) -> Variante:
    item = item_get(tenant=tenant, item_id=item_id)
    if item.tenant_id != tenant.id:  # defensa en profundidad
        raise ValidationError("El item no pertenece a este negocio.")
    variante = Variante(
        tenant=tenant, item=item, nombre=nombre, precio_extra=precio_extra
    )
    variante.full_clean(exclude=["tenant"])
    variante.save()
    return variante


def variante_update(*, variante: Variante, **fields: Any) -> Variante:
    _reject_immutable(fields)
    return _apply(variante, fields)


def variante_delete(*, variante: Variante) -> None:
    variante.delete()
