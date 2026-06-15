"""Vistas delgadas de pedidos."""
from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Tenant
from apps.accounts.permissions import HasTenantAccess

from . import services
from .selectors import pedido_get, pedido_get_by_token, pedido_list
from .serializers import PedidoCreateInput, PedidoEstadoInput, PedidoOutput
from .throttles import OrderCreateThrottle, OrderTrackThrottle

PANEL_PERMS = [IsAuthenticated, HasTenantAccess]


# ====================== Público (cliente) ======================
class PublicPedidoCreateApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OrderCreateThrottle]  # límite por restaurante (no por IP)

    def post(self, request: Request, slug: str) -> Response:
        tenant = Tenant.objects.filter(slug=slug, activo=True).first()
        if tenant is None:
            return Response({"detail": "Negocio no encontrado."}, status=404)
        s = PedidoCreateInput(data=request.data)
        s.is_valid(raise_exception=True)
        pedido = services.pedido_create(tenant=tenant, **s.validated_data)
        return Response(PedidoOutput(pedido).data, status=status.HTTP_201_CREATED)


class PublicPedidoDetailApi(APIView):
    """Seguimiento del pedido por token opaco (sin auth, no adivinable)."""
    permission_classes = [AllowAny]
    throttle_classes = [OrderTrackThrottle]  # límite por restaurante (no por IP)

    def get(self, request: Request, slug: str, token: str) -> Response:
        tenant = Tenant.objects.filter(slug=slug, activo=True).first()
        if tenant is None:
            return Response({"detail": "Negocio no encontrado."}, status=404)
        pedido = pedido_get_by_token(tenant=tenant, token=token)
        return Response(PedidoOutput(pedido).data)


# ====================== Panel / Cocina ======================
class PedidoListApi(APIView):
    permission_classes = PANEL_PERMS

    def get(self, request: Request) -> Response:
        estado = request.query_params.get("estado")
        estados = estado.split(",") if estado else None
        pedidos = pedido_list(tenant=request.tenant, estados=estados)[:200]
        return Response(PedidoOutput(pedidos, many=True).data)


class PedidoEstadoApi(APIView):
    permission_classes = PANEL_PERMS

    def post(self, request: Request, pk: int) -> Response:
        pedido = pedido_get(tenant=request.tenant, pedido_id=pk)
        s = PedidoEstadoInput(data=request.data)
        s.is_valid(raise_exception=True)
        pedido = services.pedido_set_estado(pedido=pedido, estado=s.validated_data["estado"])
        return Response(PedidoOutput(pedido).data)
