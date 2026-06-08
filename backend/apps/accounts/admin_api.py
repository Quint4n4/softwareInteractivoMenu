"""API del super-admin de PLATAFORMA.

Estas vistas operan POR ENCIMA de todos los negocios (alta, suspensión, planes).
TODAS exigen IsPlatformAdmin (super-admin). Vistas delgadas: parsean, llaman un
servicio/selector y responden. Cero lógica de negocio aquí.
"""
from __future__ import annotations

from uuid import UUID

from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsPlatformAdmin
from .selectors import (
    modulo_list,
    plan_list,
    tenant_get_any,
    tenant_list_all,
    tenant_modulos_overview,
)
from .serializers import (
    AdminTenantOutput,
    AdminTenantUpdateInput,
    ModuloOutput,
    PlanOutput,
    RegisterInput,
    TenantModuloOverviewSerializer,
    TenantModuloSetInput,
)
from .services import (
    owner_register,
    tenant_admin_update,
    tenant_reactivate,
    tenant_set_modulo,
    tenant_suspend,
)

PLATFORM_PERMS = [IsAuthenticated, IsPlatformAdmin]


class AdminTenantListCreateApi(GenericAPIView):
    permission_classes = PLATFORM_PERMS
    serializer_class = AdminTenantOutput

    def get(self, request: Request) -> Response:
        page = self.paginate_queryset(tenant_list_all())
        return self.get_paginated_response(AdminTenantOutput(page, many=True).data)

    def post(self, request: Request) -> Response:
        """Alta de negocio: crea usuario dueño + negocio + tema + membresía."""
        s = RegisterInput(data=request.data)
        s.is_valid(raise_exception=True)
        result = owner_register(**s.validated_data)
        return Response(
            AdminTenantOutput(result["tenant"]).data, status=status.HTTP_201_CREATED
        )


class AdminTenantDetailApi(APIView):
    permission_classes = PLATFORM_PERMS

    def get(self, request: Request, pk: UUID) -> Response:
        return Response(AdminTenantOutput(tenant_get_any(tenant_id=pk)).data)

    def patch(self, request: Request, pk: UUID) -> Response:
        tenant = tenant_get_any(tenant_id=pk)
        s = AdminTenantUpdateInput(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        tenant = tenant_admin_update(tenant=tenant, **s.validated_data)
        return Response(AdminTenantOutput(tenant).data)


class AdminTenantSuspendApi(APIView):
    permission_classes = PLATFORM_PERMS

    def post(self, request: Request, pk: UUID) -> Response:
        tenant = tenant_suspend(tenant=tenant_get_any(tenant_id=pk))
        return Response(AdminTenantOutput(tenant).data)


class AdminTenantReactivateApi(APIView):
    permission_classes = PLATFORM_PERMS

    def post(self, request: Request, pk: UUID) -> Response:
        tenant = tenant_reactivate(tenant=tenant_get_any(tenant_id=pk))
        return Response(AdminTenantOutput(tenant).data)


class AdminPlanListApi(APIView):
    permission_classes = PLATFORM_PERMS

    def get(self, request: Request) -> Response:
        return Response(PlanOutput(plan_list(), many=True).data)


class AdminModuloListApi(APIView):
    """Catálogo de módulos/plugins disponibles en la plataforma."""
    permission_classes = PLATFORM_PERMS

    def get(self, request: Request) -> Response:
        return Response(ModuloOutput(modulo_list(), many=True).data)


class AdminTenantModuloApi(APIView):
    """Módulos de un negocio: ver estado (GET) y activar/desactivar (POST)."""
    permission_classes = PLATFORM_PERMS

    def get(self, request: Request, pk: UUID) -> Response:
        tenant = tenant_get_any(tenant_id=pk)
        data = tenant_modulos_overview(tenant=tenant)
        return Response(TenantModuloOverviewSerializer(data, many=True).data)

    def post(self, request: Request, pk: UUID) -> Response:
        tenant = tenant_get_any(tenant_id=pk)
        s = TenantModuloSetInput(data=request.data)
        s.is_valid(raise_exception=True)
        tenant_set_modulo(tenant=tenant, **s.validated_data)
        data = tenant_modulos_overview(tenant=tenant)
        return Response(TenantModuloOverviewSerializer(data, many=True).data)
