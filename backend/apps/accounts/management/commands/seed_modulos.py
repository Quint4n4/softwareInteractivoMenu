"""Crea (idempotente) el catálogo estándar de módulos/plugins de la plataforma.

Uso:
    python manage.py seed_modulos
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand

from apps.accounts.models import Modulo

MODULOS: list[dict[str, Any]] = [
    {"clave": Modulo.Clave.MENU, "nombre": "Menú",
     "descripcion": "Carta digital por QR (incluido en el plan base).", "precio_addon": "0"},
    {"clave": Modulo.Clave.CATALOGO, "nombre": "Catálogo de productos",
     "descripcion": "Tienda de productos para pedir y recoger. Add-on de pago.", "precio_addon": "199"},
    {"clave": Modulo.Clave.ORDER_PAY, "nombre": "Order & Pay",
     "descripcion": "Pedido y pago en línea desde la mesa.", "precio_addon": "0"},
    {"clave": Modulo.Clave.RESERVAS, "nombre": "Reservas",
     "descripcion": "Reserva de mesas.", "precio_addon": "0"},
    {"clave": Modulo.Clave.FIDELIDAD, "nombre": "Fidelización",
     "descripcion": "Programa de lealtad para clientes.", "precio_addon": "0"},
]


class Command(BaseCommand):
    help = "Crea el catálogo estándar de módulos de la plataforma."

    def handle(self, *args: Any, **opts: Any) -> None:
        nuevos = 0
        for m in MODULOS:
            _, created = Modulo.objects.get_or_create(
                clave=m["clave"],
                defaults={
                    "nombre": m["nombre"],
                    "descripcion": m["descripcion"],
                    "precio_addon": Decimal(m["precio_addon"]),
                },
            )
            nuevos += int(created)
        self.stdout.write(self.style.SUCCESS(
            f"Módulos listos: {Modulo.objects.count()} en total ({nuevos} nuevos)."
        ))
