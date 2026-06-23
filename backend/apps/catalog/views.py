"""Vistas DELGADAS: parsean la petición, llaman un service/selector y responden.
Cero lógica de negocio y cero queries aquí."""
from __future__ import annotations

from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import HasTenantAccess
from apps.accounts.selectors import tenant_active_modulos

from . import services
from .selectors import (
    categoria_get,
    categoria_list,
    coleccion_get,
    coleccion_list,
    item_get,
    item_list,
    items_agotados_hoy,
    public_colecciones_for,
    public_tenant,
    variante_get,
    variante_list,
)
from .serializers import (
    CategoriaInput,
    CategoriaOutput,
    CategoriaUpdateInput,
    ColeccionInput,
    ColeccionOutput,
    ColeccionUpdateInput,
    ItemDisponibilidadInput,
    ItemImagenInput,
    ItemInput,
    ItemOutput,
    ItemUpdateInput,
    PublicColeccionOutput,
    VarianteInput,
    VarianteOutput,
    VarianteUpdateInput,
)

PANEL_PERMS = [IsAuthenticated, HasTenantAccess]


# ============================ Colección ============================
class ColeccionListCreateApi(GenericAPIView):
    permission_classes = PANEL_PERMS
    serializer_class = ColeccionOutput

    def get(self, request: Request) -> Response:
        page = self.paginate_queryset(coleccion_list(tenant=request.tenant))
        return self.get_paginated_response(ColeccionOutput(page, many=True).data)

    def post(self, request: Request) -> Response:
        s = ColeccionInput(data=request.data)
        s.is_valid(raise_exception=True)
        col = services.coleccion_create(tenant=request.tenant, **s.validated_data)
        return Response(ColeccionOutput(col).data, status=status.HTTP_201_CREATED)


class ColeccionDetailApi(APIView):
    permission_classes = PANEL_PERMS

    def get(self, request: Request, pk: int) -> Response:
        col = coleccion_get(tenant=request.tenant, coleccion_id=pk)
        return Response(ColeccionOutput(col).data)

    def patch(self, request: Request, pk: int) -> Response:
        col = coleccion_get(tenant=request.tenant, coleccion_id=pk)
        s = ColeccionUpdateInput(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        col = services.coleccion_update(coleccion=col, **s.validated_data)
        return Response(ColeccionOutput(col).data)

    def delete(self, request: Request, pk: int) -> Response:
        col = coleccion_get(tenant=request.tenant, coleccion_id=pk)
        services.coleccion_delete(coleccion=col)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================ Categoría ============================
class CategoriaListCreateApi(GenericAPIView):
    permission_classes = PANEL_PERMS
    serializer_class = CategoriaOutput

    def get(self, request: Request) -> Response:
        page = self.paginate_queryset(categoria_list(tenant=request.tenant))
        return self.get_paginated_response(CategoriaOutput(page, many=True).data)

    def post(self, request: Request) -> Response:
        s = CategoriaInput(data=request.data)
        s.is_valid(raise_exception=True)
        cat = services.categoria_create(tenant=request.tenant, **s.validated_data)
        return Response(CategoriaOutput(cat).data, status=status.HTTP_201_CREATED)


class CategoriaDetailApi(APIView):
    permission_classes = PANEL_PERMS

    def get(self, request: Request, pk: int) -> Response:
        cat = categoria_get(tenant=request.tenant, categoria_id=pk)
        return Response(CategoriaOutput(cat).data)

    def patch(self, request: Request, pk: int) -> Response:
        cat = categoria_get(tenant=request.tenant, categoria_id=pk)
        s = CategoriaUpdateInput(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        cat = services.categoria_update(categoria=cat, **s.validated_data)
        return Response(CategoriaOutput(cat).data)

    def delete(self, request: Request, pk: int) -> Response:
        cat = categoria_get(tenant=request.tenant, categoria_id=pk)
        services.categoria_delete(categoria=cat)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================== Item ===============================
class ItemListCreateApi(GenericAPIView):
    permission_classes = PANEL_PERMS
    serializer_class = ItemOutput

    def get(self, request: Request) -> Response:
        page = self.paginate_queryset(item_list(tenant=request.tenant))
        return self.get_paginated_response(ItemOutput(page, many=True).data)

    def post(self, request: Request) -> Response:
        s = ItemInput(data=request.data)
        s.is_valid(raise_exception=True)
        item = services.item_create(tenant=request.tenant, **s.validated_data)
        return Response(ItemOutput(item).data, status=status.HTTP_201_CREATED)


class ItemDetailApi(APIView):
    permission_classes = PANEL_PERMS

    def get(self, request: Request, pk: int) -> Response:
        item = item_get(tenant=request.tenant, item_id=pk)
        return Response(ItemOutput(item).data)

    def patch(self, request: Request, pk: int) -> Response:
        item = item_get(tenant=request.tenant, item_id=pk)
        s = ItemUpdateInput(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        item = services.item_update(item=item, **s.validated_data)
        return Response(ItemOutput(item).data)

    def delete(self, request: Request, pk: int) -> Response:
        item = item_get(tenant=request.tenant, item_id=pk)
        services.item_delete(item=item)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ItemDisponibilidadApi(APIView):
    """Endpoint EXPLÍCITO para cambiar el estado 'disponible' (marcar agotado)."""
    permission_classes = PANEL_PERMS

    def post(self, request: Request, pk: int) -> Response:
        item = item_get(tenant=request.tenant, item_id=pk)
        s = ItemDisponibilidadInput(data=request.data)
        s.is_valid(raise_exception=True)
        item = services.item_set_disponibilidad(
            item=item, disponible=s.validated_data["disponible"]
        )
        return Response(ItemOutput(item).data)


class ItemImagenApi(APIView):
    """Sube/reemplaza la foto de un platillo (multipart, campo 'imagen')."""
    permission_classes = PANEL_PERMS
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request, pk: int) -> Response:
        item = item_get(tenant=request.tenant, item_id=pk)
        s = ItemImagenInput(data=request.data)
        s.is_valid(raise_exception=True)
        item = services.item_set_imagen(item=item, imagen=s.validated_data["imagen"])
        return Response(ItemOutput(item, context={"request": request}).data)


# ============================ Variante =============================
class VarianteListCreateApi(GenericAPIView):
    permission_classes = PANEL_PERMS
    serializer_class = VarianteOutput

    def get(self, request: Request) -> Response:
        page = self.paginate_queryset(variante_list(tenant=request.tenant))
        return self.get_paginated_response(VarianteOutput(page, many=True).data)

    def post(self, request: Request) -> Response:
        s = VarianteInput(data=request.data)
        s.is_valid(raise_exception=True)
        var = services.variante_create(tenant=request.tenant, **s.validated_data)
        return Response(VarianteOutput(var).data, status=status.HTTP_201_CREATED)


class VarianteDetailApi(APIView):
    permission_classes = PANEL_PERMS

    def get(self, request: Request, pk: int) -> Response:
        var = variante_get(tenant=request.tenant, variante_id=pk)
        return Response(VarianteOutput(var).data)

    def patch(self, request: Request, pk: int) -> Response:
        var = variante_get(tenant=request.tenant, variante_id=pk)
        s = VarianteUpdateInput(data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        var = services.variante_update(variante=var, **s.validated_data)
        return Response(VarianteOutput(var).data)

    def delete(self, request: Request, pk: int) -> Response:
        var = variante_get(tenant=request.tenant, variante_id=pk)
        services.variante_delete(variante=var)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ====================== Vitrina pública (sin auth) =================
class PublicMenuApi(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, slug: str) -> Response:
        tenant = public_tenant(slug=slug)
        if tenant is None:
            return Response({"detail": "Negocio no encontrado."}, status=404)

        tema = getattr(tenant, "tema", None)
        negocio = {
            "nombre": tenant.nombre,
            "slug": tenant.slug,
            "modo_vitrina": tenant.modo_vitrina,
            "idioma_default": tenant.idioma_default,
            "idiomas": tenant.idiomas,
        }
        tema_data = {
            "color_primario": tema.color_primario if tema else "#1F3864",
            "color_secundario": tema.color_secundario if tema else "#2E75B6",
            "tipografia": tema.tipografia if tema else "Editorial",
            "logo": tema.logo.url if (tema and tema.logo) else None,
        }

        # Negocio suspendido: la vitrina muestra "no disponible".
        if not tenant.activo:
            return Response(
                {"negocio": negocio, "disponible": False, "modulos": [],
                 "tema": tema_data, "colecciones": []}
            )

        colecciones = public_colecciones_for(tenant=tenant)
        # Una sola query agregada para calcular los agotados del día; sin N+1.
        agotados = items_agotados_hoy(tenant=tenant)
        return Response(
            {
                "negocio": negocio,
                "disponible": True,
                "modulos": tenant_active_modulos(tenant=tenant),
                "tema": tema_data,
                "colecciones": PublicColeccionOutput(
                    colecciones, many=True, context={"agotados_hoy": agotados}
                ).data,
            }
        )
