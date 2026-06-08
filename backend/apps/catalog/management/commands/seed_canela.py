"""Puebla el menú de demo "Canela & Café" para un tenant existente.

Uso:
    python manage.py seed_canela --slug prueba

Es idempotente: borra el menú anterior del tenant y lo recrea.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand

from apps.accounts.models import Tema, Tenant
from apps.catalog.models import Categoria, Coleccion, Item, Variante

MENU: list[dict[str, Any]] = [
    {
        "nombre": "Paquetes",
        "items": [
            {"nombre": "Desayuno Canela", "precio": "159", "tag": "Favorito",
             "desc": "Nuestro desayuno completo para empezar el día con calma.",
             "pack": ["Chilaquiles verdes o tostada de aguacate", "Fruta de temporada",
                      "Café americano o capuchino", "Pan dulce del día"]},
            {"nombre": "Café & Postre", "precio": "99",
             "desc": "El antojo perfecto de la tarde.",
             "pack": ["Bebida caliente a elegir", "Rebanada de pastel del día"]},
            {"nombre": "Brunch para compartir", "precio": "289",
             "desc": "Ideal para dos personas, con todo lo que más nos piden.",
             "pack": ["2 platos fuertes a elegir", "Tabla de fruta de temporada",
                      "2 bebidas (frías o calientes)", "2 postres individuales"]},
        ],
    },
    {
        "nombre": "Desayunos",
        "items": [
            {"nombre": "Tostada de aguacate", "precio": "89", "tag": "Favorito",
             "desc": "Pan de masa madre, aguacate, huevo pochado y semillas tostadas."},
            {"nombre": "Chilaquiles verdes", "precio": "95",
             "desc": "Totopos en salsa verde de la casa, crema, queso fresco y huevo."},
            {"nombre": "Hotcakes de avena", "precio": "78",
             "desc": "Esponjosos, con plátano caramelizado y miel de maple."},
            {"nombre": "Bowl de yogurt", "precio": "72", "tag": "Ligero",
             "desc": "Yogurt natural, granola casera, frutos rojos y miel."},
        ],
    },
    {
        "nombre": "Comidas",
        "items": [
            {"nombre": "Sándwich de pollo", "precio": "98",
             "desc": "Pollo a la parrilla, pesto, jitomate y rúcula en focaccia."},
            {"nombre": "Panini caprese", "precio": "89",
             "desc": "Mozzarella fresca, jitomate, albahaca y reducción de balsámico."},
            {"nombre": "Ensalada de la casa", "precio": "85", "tag": "Ligero",
             "desc": "Mezcla verde, manzana, nuez caramelizada y vinagreta de miel."},
            {"nombre": "Quiche de espinaca", "precio": "92",
             "desc": "Masa de mantequilla, espinaca y queso de cabra."},
        ],
    },
    {
        "nombre": "Café & calientes",
        "items": [
            {"nombre": "Espresso", "precio": "38",
             "desc": "Doble shot de nuestra mezcla de la casa, intenso y aromático."},
            {"nombre": "Cappuccino", "precio": "52", "tag": "Favorito",
             "desc": "Espresso con leche vaporizada y una capa de espuma sedosa.",
             "variants": [("Chico", "0"), ("Grande", "12")]},
            {"nombre": "Latte de vainilla", "precio": "58",
             "desc": "Espresso, leche cremosa y vainilla natural.",
             "variants": [("Chico", "0"), ("Grande", "12")]},
            {"nombre": "Chocolate caliente", "precio": "55",
             "desc": "Chocolate belga fundido con leche cremosa y malvaviscos."},
            {"nombre": "Té chai", "precio": "50",
             "desc": "Especias, leche vaporizada y un toque de miel de abeja."},
        ],
    },
    {
        "nombre": "Bebidas frías",
        "items": [
            {"nombre": "Iced latte", "precio": "56",
             "desc": "Espresso sobre hielo con leche fría. Refrescante y suave.",
             "variants": [("12 oz", "0"), ("16 oz", "14")]},
            {"nombre": "Limonada de menta", "precio": "48", "tag": "Ligero",
             "desc": "Limón natural, menta fresca y agua mineral."},
            {"nombre": "Frappé de caramelo", "precio": "65", "tag": "Favorito",
             "desc": "Café, hielo, caramelo y crema batida.",
             "variants": [("12 oz", "0"), ("16 oz", "14")]},
            {"nombre": "Matcha frío", "precio": "62",
             "desc": "Matcha ceremonial con leche de avena sobre hielo."},
        ],
    },
    {
        "nombre": "Postres",
        "items": [
            {"nombre": "Cheesecake de frutos rojos", "precio": "69", "tag": "Favorito",
             "desc": "Cremoso, con coulis de frutos rojos del día."},
            {"nombre": "Tarta de chocolate", "precio": "72",
             "desc": "Ganache intenso sobre base crujiente de galleta."},
            {"nombre": "Pay de limón", "precio": "65",
             "desc": "Merengue dorado y relleno cítrico equilibrado."},
            {"nombre": "Rebanada de zanahoria", "precio": "68",
             "desc": "Con frosting de queso crema y nuez tostada."},
            {"nombre": "Tiramisú", "precio": "75",
             "desc": "Clásico italiano con café espresso y mascarpone."},
        ],
    },
]


class Command(BaseCommand):
    help = "Puebla el menú demo Canela & Café para un tenant."

    def add_arguments(self, parser):
        parser.add_argument("--slug", default="prueba", help="slug del negocio a poblar")
        parser.add_argument("--rename", action="store_true",
                            help="renombra el negocio a 'Canela & Café' y ajusta su tema")

    def handle(self, *args, **opts):
        slug = opts["slug"]
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            self.stderr.write(self.style.ERROR(f"No existe un negocio con slug '{slug}'."))
            return

        if opts["rename"]:
            tenant.nombre = "Canela & Café"
            tenant.modo_vitrina = Tenant.ModoVitrina.MENU
            tenant.save()
            tema, _ = Tema.objects.get_or_create(tenant=tenant)
            tema.color_primario = "#6F4A35"
            tema.tipografia = "Editorial"
            tema.save()

        # Idempotente: borra el menú anterior y recrea.
        Coleccion.all_objects.filter(tenant=tenant, tipo=Coleccion.Tipo.MENU).delete()
        col = Coleccion.objects.create(tenant=tenant, tipo=Coleccion.Tipo.MENU, nombre="Menú", orden=0)

        n_items = 0
        for ci, cat in enumerate(MENU):
            categoria = Categoria.objects.create(
                tenant=tenant, coleccion=col, nombre=cat["nombre"], orden=ci
            )
            for ii, it in enumerate(cat["items"]):
                es_pack = bool(it.get("pack"))
                item = Item.objects.create(
                    tenant=tenant, categoria=categoria, nombre=it["nombre"],
                    precio=Decimal(it["precio"]), descripcion=it.get("desc", ""),
                    etiqueta=it.get("tag", ""),
                    destacado=it.get("tag") == "Favorito",
                    es_paquete=es_pack, incluye=it.get("pack", []),
                    orden=ii,
                )
                for vn, vp in it.get("variants", []):
                    Variante.objects.create(
                        tenant=tenant, item=item, nombre=vn, precio_extra=Decimal(vp)
                    )
                n_items += 1

        self.stdout.write(self.style.SUCCESS(
            f"Menú creado para '{tenant.nombre}' ({slug}): "
            f"{len(MENU)} categorías, {n_items} platillos."
        ))
