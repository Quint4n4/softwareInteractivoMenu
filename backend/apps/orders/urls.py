from django.urls import path

from .views import (
    PedidoEstadoApi,
    PedidoListApi,
    PublicPedidoCreateApi,
    PublicPedidoDetailApi,
)

urlpatterns = [
    path("pedidos/", PedidoListApi.as_view(), name="pedido-list"),
    path("pedidos/<int:pk>/estado/", PedidoEstadoApi.as_view(), name="pedido-estado"),
    path("public/<slug:slug>/pedidos/", PublicPedidoCreateApi.as_view(), name="public-pedido-create"),
    path("public/<slug:slug>/pedidos/<str:numero>/", PublicPedidoDetailApi.as_view(), name="public-pedido-detail"),
]
