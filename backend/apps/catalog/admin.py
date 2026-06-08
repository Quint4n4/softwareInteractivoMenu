from django.contrib import admin

from .models import Categoria, CodigoQR, Coleccion, Item, Variante


@admin.register(Coleccion)
class ColeccionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "tenant", "activo", "orden")
    list_filter = ("tipo", "activo")


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "coleccion", "tenant", "activo", "orden")
    list_filter = ("activo",)


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("nombre", "categoria", "tenant", "precio", "disponible", "destacado")
    list_filter = ("disponible", "destacado")
    search_fields = ("nombre", "sku")


admin.site.register(Variante)
admin.site.register(CodigoQR)
