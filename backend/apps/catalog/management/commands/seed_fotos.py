"""Asigna fotos a los platillos en lote, emparejando por nombre de archivo.

Pon las imágenes en una carpeta dentro de backend/ (ej. backend/seed_images/),
nombrando cada archivo como el platillo (ej. "Cappuccino.jpg", "desayuno-canela.png").
Luego:

    docker compose exec backend python manage.py seed_fotos --slug prueba --dir seed_images

Empareja por slug del nombre (ignora mayúsculas/acentos/espacios). Reporta lo que
no haya hecho match para que puedas renombrar.
"""
from __future__ import annotations

import os

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.accounts.models import Tenant
from apps.catalog.models import Item

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


class Command(BaseCommand):
    help = "Asigna fotos a los platillos emparejando por nombre de archivo."

    def add_arguments(self, parser):
        parser.add_argument("--slug", default="prueba", help="slug del negocio")
        parser.add_argument("--dir", default="seed_images", help="carpeta con las imágenes (relativa a backend/)")

    def handle(self, *args, **opts):
        slug = opts["slug"]
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            self.stderr.write(self.style.ERROR(f"No existe el negocio '{slug}'."))
            return

        directory = opts["dir"]
        if not os.path.isdir(directory):
            self.stderr.write(self.style.ERROR(f"No existe la carpeta '{directory}'."))
            return

        # Índice de items por slug del nombre.
        items = list(Item.all_objects.filter(tenant=tenant))
        by_slug = {slugify(it.nombre): it for it in items}

        ok, sin_match = 0, []
        for fname in sorted(os.listdir(directory)):
            stem, ext = os.path.splitext(fname)
            if ext.lower() not in EXTS:
                continue
            key = slugify(stem)
            item = by_slug.get(key)
            if item is None:
                # match parcial: el slug del archivo contiene o está contenido
                item = next(
                    (it for s, it in by_slug.items() if key and (key in s or s in key)),
                    None,
                )
            if item is None:
                sin_match.append(fname)
                continue
            path = os.path.join(directory, fname)
            with open(path, "rb") as f:
                item.imagen.save(fname, File(f), save=True)
            ok += 1
            self.stdout.write(f"  ✓ {fname}  →  {item.nombre}")

        self.stdout.write(self.style.SUCCESS(f"\nListo: {ok} fotos asignadas."))
        if sin_match:
            self.stdout.write(self.style.WARNING(
                "Sin match (renómbralas como el platillo): " + ", ".join(sin_match)
            ))
        usados = {slugify(it.nombre) for it in items if it.imagen}
        faltan = [it.nombre for it in items if slugify(it.nombre) not in usados]
        if faltan:
            self.stdout.write("Platillos sin foto: " + ", ".join(faltan))
