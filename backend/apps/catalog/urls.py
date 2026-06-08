from django.urls import path

from .views import (
    CategoriaDetailApi,
    CategoriaListCreateApi,
    ColeccionDetailApi,
    ColeccionListCreateApi,
    ItemDetailApi,
    ItemDisponibilidadApi,
    ItemImagenApi,
    ItemListCreateApi,
    PublicMenuApi,
    VarianteDetailApi,
    VarianteListCreateApi,
)

urlpatterns = [
    path("colecciones/", ColeccionListCreateApi.as_view(), name="coleccion-list"),
    path("colecciones/<int:pk>/", ColeccionDetailApi.as_view(), name="coleccion-detail"),
    path("categorias/", CategoriaListCreateApi.as_view(), name="categoria-list"),
    path("categorias/<int:pk>/", CategoriaDetailApi.as_view(), name="categoria-detail"),
    path("items/", ItemListCreateApi.as_view(), name="item-list"),
    path("items/<int:pk>/", ItemDetailApi.as_view(), name="item-detail"),
    path("items/<int:pk>/disponibilidad/", ItemDisponibilidadApi.as_view(), name="item-disponibilidad"),
    path("items/<int:pk>/imagen/", ItemImagenApi.as_view(), name="item-imagen"),
    path("variantes/", VarianteListCreateApi.as_view(), name="variante-list"),
    path("variantes/<int:pk>/", VarianteDetailApi.as_view(), name="variante-detail"),
    path("public/<slug:slug>/menu/", PublicMenuApi.as_view(), name="public-menu"),
]
