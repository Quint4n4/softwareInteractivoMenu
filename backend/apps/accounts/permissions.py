"""Permisos relacionados con el tenant del usuario autenticado."""
from __future__ import annotations

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class HasTenantAccess(BasePermission):
    """El usuario debe pertenecer a un negocio. Fija request.tenant para la vista.

    Esto resuelve el tenant del PANEL del dueño a partir de su Membership
    (a diferencia de la vitrina pública, que lo resuelve por host).
    """
    message = "El usuario no tiene un negocio asociado."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        membership = user.membresias.select_related("tenant").first()
        if membership is None:
            return False
        request.tenant = membership.tenant
        request.membership = membership
        return True


class IsPlatformAdmin(BasePermission):
    """Solo el dueño de la PLATAFORMA (super-admin de Django).

    Distinto de HasTenantAccess: este permiso opera POR ENCIMA de todos los
    negocios (alta/suspensión, módulos, planes). Por eso se restringe al
    super-admin y NO fija ningún request.tenant.
    """
    message = "Se requiere acceso de administrador de la plataforma."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_superuser)
