"""Carga traducciones al inglés (campo i18n) del menú demo "Canela & Café" y
activa los idiomas ["es", "en"] en el negocio.

Es idempotente: vuelve a aplicar las traducciones sin duplicar nada.

Uso:
    python manage.py seed_i18n --slug prueba
"""
from __future__ import annotations

from argparse import ArgumentParser
from typing import Any

from django.core.management.base import BaseCommand

from apps.accounts.models import Tenant
from apps.catalog.models import Categoria, Item

# Nombre en español -> nombre en inglés
CATEGORIAS_EN: dict[str, str] = {
    "Paquetes": "Bundles",
    "Desayunos": "Breakfast",
    "Comidas": "Lunch",
    "Café & calientes": "Coffee & hot drinks",
    "Bebidas frías": "Cold drinks",
    "Postres": "Desserts",
}

# Nombre en español -> { nombre, descripcion, incluye? } en inglés
ITEMS_EN: dict[str, dict[str, Any]] = {
    "Desayuno Canela": {
        "nombre": "Canela Breakfast",
        "descripcion": "Our complete breakfast to start the day calmly.",
        "incluye": [
            "Green chilaquiles or avocado toast",
            "Seasonal fruit",
            "Americano or cappuccino",
            "Pastry of the day",
        ],
    },
    "Café & Postre": {
        "nombre": "Coffee & Dessert",
        "descripcion": "The perfect afternoon treat.",
        "incluye": ["Hot drink of your choice", "Cake slice of the day"],
    },
    "Brunch para compartir": {
        "nombre": "Brunch to share",
        "descripcion": "Ideal for two, with everything people ask for most.",
        "incluye": [
            "2 main dishes of your choice",
            "Seasonal fruit board",
            "2 drinks (cold or hot)",
            "2 individual desserts",
        ],
    },
    "Tostada de aguacate": {
        "nombre": "Avocado toast",
        "descripcion": "Sourdough bread, avocado, poached egg and toasted seeds.",
    },
    "Chilaquiles verdes": {
        "nombre": "Green chilaquiles",
        "descripcion": "House green-salsa tortilla chips, cream, fresh cheese and egg.",
    },
    "Hotcakes de avena": {
        "nombre": "Oat pancakes",
        "descripcion": "Fluffy, with caramelized banana and maple syrup.",
    },
    "Bowl de yogurt": {
        "nombre": "Yogurt bowl",
        "descripcion": "Natural yogurt, homemade granola, berries and honey.",
    },
    "Sándwich de pollo": {
        "nombre": "Chicken sandwich",
        "descripcion": "Grilled chicken, pesto, tomato and arugula on focaccia.",
    },
    "Panini caprese": {
        "nombre": "Caprese panini",
        "descripcion": "Fresh mozzarella, tomato, basil and balsamic reduction.",
    },
    "Ensalada de la casa": {
        "nombre": "House salad",
        "descripcion": "Greens, apple, caramelized walnut and honey vinaigrette.",
    },
    "Quiche de espinaca": {
        "nombre": "Spinach quiche",
        "descripcion": "Butter crust, spinach and goat cheese.",
    },
    "Espresso": {
        "nombre": "Espresso",
        "descripcion": "Double shot of our house blend, intense and aromatic.",
    },
    "Cappuccino": {
        "nombre": "Cappuccino",
        "descripcion": "Espresso with steamed milk and a silky foam layer.",
    },
    "Latte de vainilla": {
        "nombre": "Vanilla latte",
        "descripcion": "Espresso, creamy milk and natural vanilla.",
    },
    "Chocolate caliente": {
        "nombre": "Hot chocolate",
        "descripcion": "Melted Belgian chocolate with creamy milk and marshmallows.",
    },
    "Té chai": {
        "nombre": "Chai tea",
        "descripcion": "Spices, steamed milk and a touch of honey.",
    },
    "Iced latte": {
        "nombre": "Iced latte",
        "descripcion": "Espresso over ice with cold milk. Refreshing and smooth.",
    },
    "Limonada de menta": {
        "nombre": "Mint lemonade",
        "descripcion": "Fresh lemon, mint and sparkling water.",
    },
    "Frappé de caramelo": {
        "nombre": "Caramel frappé",
        "descripcion": "Coffee, ice, caramel and whipped cream.",
    },
    "Matcha frío": {
        "nombre": "Iced matcha",
        "descripcion": "Ceremonial matcha with oat milk over ice.",
    },
    "Cheesecake de frutos rojos": {
        "nombre": "Berry cheesecake",
        "descripcion": "Creamy, with berry coulis of the day.",
    },
    "Tarta de chocolate": {
        "nombre": "Chocolate tart",
        "descripcion": "Intense ganache on a crunchy cookie base.",
    },
    "Pay de limón": {
        "nombre": "Lemon pie",
        "descripcion": "Golden meringue and a balanced citrus filling.",
    },
    "Rebanada de zanahoria": {
        "nombre": "Carrot cake slice",
        "descripcion": "With cream cheese frosting and toasted walnut.",
    },
    "Tiramisú": {
        "nombre": "Tiramisú",
        "descripcion": "Italian classic with espresso coffee and mascarpone.",
    },
}


class Command(BaseCommand):
    help = "Carga traducciones al inglés del menú demo y activa los idiomas es/en."

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("--slug", default="prueba", help="slug del negocio a traducir")

    def handle(self, *args: Any, **opts: Any) -> None:
        slug: str = opts["slug"]
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            self.stderr.write(self.style.ERROR(f"No existe un negocio con slug '{slug}'."))
            return

        tenant.idioma_default = "es"
        tenant.idiomas = ["es", "en"]
        tenant.save(update_fields=["idioma_default", "idiomas"])

        n_cat = 0
        for cat in Categoria.all_objects.filter(tenant=tenant):
            nombre_en = CATEGORIAS_EN.get(cat.nombre)
            if not nombre_en:
                continue
            i18n = dict(cat.i18n or {})
            i18n["en"] = {"nombre": nombre_en}
            cat.i18n = i18n
            cat.save(update_fields=["i18n"])
            n_cat += 1

        n_item = 0
        for item in Item.all_objects.filter(tenant=tenant):
            traduccion = ITEMS_EN.get(item.nombre)
            if not traduccion:
                continue
            i18n = dict(item.i18n or {})
            i18n["en"] = traduccion
            item.i18n = i18n
            item.save(update_fields=["i18n"])
            n_item += 1

        self.stdout.write(self.style.SUCCESS(
            f"Traducciones EN aplicadas a '{tenant.nombre}' ({slug}): "
            f"{n_cat} categorías, {n_item} platillos. Idiomas: {tenant.idiomas}."
        ))
