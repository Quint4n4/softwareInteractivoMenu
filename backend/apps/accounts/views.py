"""Vistas delgadas de cuentas."""
from __future__ import annotations

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import HasTenantAccess
from .selectors import membership_for_user, tema_get, tenant_active_modulos
from .serializers import (
    RegisterInput,
    TemaInput,
    TemaLogoInput,
    TemaOutput,
    TenantOutput,
    TenantUpdateInput,
    UserOutput,
)
from .services import owner_register, tema_set_logo, tema_update, tenant_update


def tokens_for(user) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class ThrottledLoginView(TokenObtainPairView):
    """Login (JWT) con límite de tasa para frenar fuerza bruta de contraseñas."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class RegisterApi(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request: Request) -> Response:
        s = RegisterInput(data=request.data)
        s.is_valid(raise_exception=True)
        result = owner_register(**s.validated_data)
        return Response(
            {
                "user": UserOutput(result["user"]).data,
                "tenant": TenantOutput(result["tenant"]).data,
                "tokens": tokens_for(result["user"]),
            },
            status=status.HTTP_201_CREATED,
        )


class MeApi(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        membership = membership_for_user(user=request.user)
        tenant = membership.tenant if membership else None
        return Response(
            {
                "user": UserOutput(request.user).data,
                "tenant": TenantOutput(tenant).data if tenant else None,
                "rol": membership.rol if membership else None,
                "is_platform_admin": request.user.is_superuser,
                "modulos": tenant_active_modulos(tenant=tenant) if tenant else [],
            }
        )


class BrandingApi(APIView):
    """Marca y apariencia del negocio: datos del negocio + tema (colores, fuente).

    GET  -> { negocio, tema }
    PATCH -> body opcional { negocio: {...}, tema: {...} }
    """
    permission_classes = [IsAuthenticated, HasTenantAccess]

    def get(self, request: Request) -> Response:
        tema = tema_get(tenant=request.tenant)
        return Response(
            {
                "negocio": TenantOutput(request.tenant).data,
                "tema": TemaOutput(tema).data,
            }
        )

    def patch(self, request: Request) -> Response:
        negocio_data = request.data.get("negocio")
        tema_data = request.data.get("tema")

        if negocio_data is not None:
            s = TenantUpdateInput(data=negocio_data, partial=True)
            s.is_valid(raise_exception=True)
            tenant_update(tenant=request.tenant, **s.validated_data)

        tema = tema_get(tenant=request.tenant)
        if tema_data is not None:
            s = TemaInput(data=tema_data, partial=True)
            s.is_valid(raise_exception=True)
            tema = tema_update(tema=tema, **s.validated_data)

        return Response(
            {
                "negocio": TenantOutput(request.tenant).data,
                "tema": TemaOutput(tema).data,
            }
        )


class BrandingLogoApi(APIView):
    """Sube/reemplaza el logo del negocio (multipart, campo 'logo'). DELETE lo quita."""
    permission_classes = [IsAuthenticated, HasTenantAccess]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request) -> Response:
        tema = tema_get(tenant=request.tenant)
        s = TemaLogoInput(data=request.data)
        s.is_valid(raise_exception=True)
        tema = tema_set_logo(tema=tema, logo=s.validated_data["logo"])
        return Response({"tema": TemaOutput(tema).data})

    def delete(self, request: Request) -> Response:
        tema = tema_get(tenant=request.tenant)
        tema = tema_set_logo(tema=tema, logo=None)
        return Response({"tema": TemaOutput(tema).data})
