"""Configuración global de pytest.

Limpia el cache (donde DRF guarda los contadores de rate-limit/throttling)
antes de cada test, para que los límites no se acumulen entre tests y los
disparen con falsos 429.
"""
import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _reset_throttle_cache():
    cache.clear()
    yield
