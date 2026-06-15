"""Throttles a la medida para los pedidos públicos.

Limitan POR NEGOCIO (el slug de la URL), NO por IP. Así no importa que los
clientes compartan el WiFi del restaurante, salgan por datos móviles o estén
detrás de CGNAT / un proxy: el límite se mide por local, que es lo que de
verdad queremos proteger (frenar que inunden la cocina de un restaurante).
"""
from __future__ import annotations

from rest_framework.throttling import SimpleRateThrottle


class _PerSlugThrottle(SimpleRateThrottle):
    """Cuenta las peticiones por slug del negocio en lugar de por IP."""

    def get_cache_key(self, request, view):
        slug = view.kwargs.get("slug")
        if not slug:
            return None  # sin slug no se limita (no debería pasar en estas rutas)
        return self.cache_format % {"scope": self.scope, "ident": slug}


class OrderCreateThrottle(_PerSlugThrottle):
    scope = "create_order"


class OrderTrackThrottle(_PerSlugThrottle):
    scope = "track_order"
