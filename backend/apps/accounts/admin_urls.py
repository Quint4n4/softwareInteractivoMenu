"""Rutas del super-admin de plataforma (montadas en /api/admin/)."""
from django.urls import path

from .admin_api import (
    AdminModuloListApi,
    AdminPlanListApi,
    AdminTenantDetailApi,
    AdminTenantListCreateApi,
    AdminTenantModuloApi,
    AdminTenantReactivateApi,
    AdminTenantSuspendApi,
)

urlpatterns = [
    path("negocios/", AdminTenantListCreateApi.as_view(), name="admin-negocio-list"),
    path("negocios/<uuid:pk>/", AdminTenantDetailApi.as_view(), name="admin-negocio-detail"),
    path("negocios/<uuid:pk>/suspender/", AdminTenantSuspendApi.as_view(), name="admin-negocio-suspender"),
    path("negocios/<uuid:pk>/reactivar/", AdminTenantReactivateApi.as_view(), name="admin-negocio-reactivar"),
    path("negocios/<uuid:pk>/modulos/", AdminTenantModuloApi.as_view(), name="admin-negocio-modulos"),
    path("modulos/", AdminModuloListApi.as_view(), name="admin-modulo-list"),
    path("planes/", AdminPlanListApi.as_view(), name="admin-plan-list"),
]
