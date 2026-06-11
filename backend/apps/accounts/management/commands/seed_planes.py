"""Crea (idempotente) los planes de ejemplo de la plataforma.

Uso:
    python manage.py seed_planes
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand

from apps.accounts.models import Modulo, Plan

PLANES: list[dict[str, Any]] = [
    {"nombre": "Prueba", "ciclo": "prueba", "precio_base": "0",
     "descripcion": "3 meses gratis para probar la plataforma.",
     "modulos": ["menu"]},
    {"nombre": "Básico", "ciclo": "anual", "precio_base": "1990",
     "descripcion": "Carta digital por QR.",
     "modulos": ["menu"]},
    {"nombre": "Pro", "ciclo": "anual", "precio_base": "3990",
     "descripcion": "Menú + tienda + pedido y pago + promociones.",
     "modulos": ["menu", "catalogo", "order_pay", "promociones"]},
    {"nombre": "Premium", "ciclo": "anual", "precio_base": "6990",
     "descripcion": "Todo + reservas, fidelización, reportes y reseñas.",
     "modulos": ["menu", "catalogo", "order_pay", "reservas", "fidelidad", "reportes", "resenas"]},
]


class Command(BaseCommand):
    help = "Crea los planes de ejemplo de la plataforma."

    def handle(self, *args: Any, **opts: Any) -> None:
        nuevos = 0
        for p in PLANES:
            plan, created = Plan.objects.get_or_create(
                nombre=p["nombre"],
                defaults={
                    "ciclo": p["ciclo"],
                    "precio_base": Decimal(p["precio_base"]),
                    "descripcion": p["descripcion"],
                },
            )
            if created:
                plan.modulos.set(Modulo.objects.filter(clave__in=p["modulos"]))
                nuevos += 1
        self.stdout.write(self.style.SUCCESS(
            f"Planes listos: {Plan.objects.count()} en total ({nuevos} nuevos)."
        ))
