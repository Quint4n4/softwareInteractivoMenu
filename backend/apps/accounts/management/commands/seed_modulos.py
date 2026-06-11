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
    {"clave": Modulo.Clave.PROMOCIONES, "nombre": "Promociones y cupones",
     "descripcion": "Descuentos y códigos de promoción para tus clientes.", "precio_addon": "590"},
    {"clave": Modulo.Clave.RESENAS, "nombre": "Reseñas y calificaciones",
     "descripcion": "Tus clientes califican y reseñan tus platillos.", "precio_addon": "390"},
    {"clave": Modulo.Clave.WHATSAPP, "nombre": "Notificaciones WhatsApp",
     "descripcion": "Avisos y tickets al cliente por WhatsApp.", "precio_addon": "790"},
    {"clave": Modulo.Clave.REPORTES, "nombre": "Reportes y analítica",
     "descripcion": "Ventas, platillos top y tendencias del negocio.", "precio_addon": "990"},
    {"clave": Modulo.Clave.INVENTARIO, "nombre": "Inventario y stock",
     "descripcion": "Control de existencias por platillo/producto.", "precio_addon": "890"},
    {"clave": Modulo.Clave.SUCURSALES, "nombre": "Multi-sucursal",
     "descripcion": "Administra varias sucursales del mismo negocio.", "precio_addon": "1490"},
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
