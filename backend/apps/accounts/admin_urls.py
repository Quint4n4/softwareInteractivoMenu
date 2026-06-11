"""Rutas del super-admin de plataforma (montadas en /api/admin/)."""
from django.urls import path

from .admin_api import (
    AdminModuloListApi,
    AdminPlanListApi,
    AdminStatsApi,
    AdminTenantDetailApi,
    AdminTenantListCreateApi,
    AdminTenantModuloApi,
    AdminTenantPagoApi,
    AdminTenantReactivateApi,
    AdminTenantResetPasswordApi,
    AdminTenantSuspendApi,
)

urlpatterns = [
    path("negocios/", AdminTenantListCreateApi.as_view(), name="admin-negocio-list"),
    path("negocios/<uuid:pk>/", AdminTenantDetailApi.as_view(), name="admin-negocio-detail"),
    path("negocios/<uuid:pk>/suspender/", AdminTenantSuspendApi.as_view(), name="admin-negocio-suspender"),
    path("negocios/<uuid:pk>/reactivar/", AdminTenantReactivateApi.as_view(), name="admin-negocio-reactivar"),
    path("negocios/<uuid:pk>/pago/", AdminTenantPagoApi.as_view(), name="admin-negocio-pago"),
    path("negocios/<uuid:pk>/reset-password/", AdminTenantResetPasswordApi.as_view(), name="admin-negocio-reset-password"),
    path("negocios/<uuid:pk>/modulos/", AdminTenantModuloApi.as_view(), name="admin-negocio-modulos"),
    path("modulos/", AdminModuloListApi.as_view(), name="admin-modulo-list"),
    path("planes/", AdminPlanListApi.as_view(), name="admin-plan-list"),
    path("stats/", AdminStatsApi.as_view(), name="admin-stats"),
]
