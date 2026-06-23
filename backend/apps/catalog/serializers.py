"""Serializers del catálogo: entrada y salida SIEMPRE separados y delgados.

Los serializers NO contienen lógica de negocio ni create()/update(); solo validan
la entrada y dan forma a la salida. La lógica vive en services.py / selectors.py.
"""
from typing import Any

from rest_framework import serializers

from .models import Categoria, Coleccion, Item, Variante


# ============================ Colección ============================
class ColeccionInput(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=Coleccion.Tipo.choices, default=Coleccion.Tipo.MENU)
    nombre = serializers.CharField(max_length=120)
    orden = serializers.IntegerField(min_value=0, default=0)


class ColeccionUpdateInput(serializers.Serializer):
    # OJO: 'activo' (flag de estado) NO se expone aquí; va por endpoint propio.
    tipo = serializers.ChoiceField(choices=Coleccion.Tipo.choices, required=False)
    nombre = serializers.CharField(max_length=120, required=False)
    orden = serializers.IntegerField(min_value=0, required=False)


class ColeccionOutput(serializers.ModelSerializer):
    class Meta:
        model = Coleccion
        fields = ("id", "tipo", "nombre", "activo", "orden")


# ============================ Categoría ============================
class CategoriaInput(serializers.Serializer):
    coleccion_id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=120)
    orden = serializers.IntegerField(min_value=0, default=0)
    i18n = serializers.JSONField(required=False)


class CategoriaUpdateInput(serializers.Serializer):
    nombre = serializers.CharField(max_length=120, required=False)
    orden = serializers.IntegerField(min_value=0, required=False)
    i18n = serializers.JSONField(required=False)


class CategoriaOutput(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ("id", "coleccion_id", "nombre", "orden", "activo", "i18n")


# ============================== Item ===============================
class VarianteOutput(serializers.ModelSerializer):
    class Meta:
        model = Variante
        fields = ("id", "item_id", "nombre", "precio_extra")


class ItemInput(serializers.Serializer):
    categoria_id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=160)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    moneda = serializers.CharField(max_length=3, default="MXN")
    etiqueta = serializers.CharField(max_length=40, required=False, allow_blank=True, default="")
    es_paquete = serializers.BooleanField(default=False)
    incluye = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    sku = serializers.CharField(max_length=60, required=False, allow_blank=True, default="")
    stock = serializers.IntegerField(required=False, allow_null=True)
    orden = serializers.IntegerField(min_value=0, default=0)
    i18n = serializers.JSONField(required=False)
    tiempo_preparacion = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    limite_diario = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class ItemUpdateInput(serializers.Serializer):
    # 'disponible' y 'destacado' (flags de estado) NO se exponen aquí.
    nombre = serializers.CharField(max_length=160, required=False)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    moneda = serializers.CharField(max_length=3, required=False)
    etiqueta = serializers.CharField(max_length=40, required=False, allow_blank=True)
    es_paquete = serializers.BooleanField(required=False)
    incluye = serializers.ListField(child=serializers.CharField(), required=False)
    sku = serializers.CharField(max_length=60, required=False, allow_blank=True)
    stock = serializers.IntegerField(required=False, allow_null=True)
    orden = serializers.IntegerField(min_value=0, required=False)
    i18n = serializers.JSONField(required=False)
    tiempo_preparacion = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    limite_diario = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class ItemDisponibilidadInput(serializers.Serializer):
    disponible = serializers.BooleanField()


class ItemImagenInput(serializers.Serializer):
    imagen = serializers.ImageField()


class ItemOutput(serializers.ModelSerializer):
    variantes = VarianteOutput(many=True, read_only=True)

    class Meta:
        model = Item
        fields = (
            "id", "categoria_id", "nombre", "descripcion", "precio", "moneda",
            "imagen", "disponible", "destacado", "etiqueta", "es_paquete",
            "incluye", "orden", "sku", "stock", "i18n",
            "tiempo_preparacion", "limite_diario",
            "variantes",
        )


# ============================ Variante =============================
class VarianteInput(serializers.Serializer):
    item_id = serializers.IntegerField()
    nombre = serializers.CharField(max_length=80)
    precio_extra = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)


class VarianteUpdateInput(serializers.Serializer):
    nombre = serializers.CharField(max_length=80, required=False)
    precio_extra = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


# ===================== Vitrina pública (output) ====================
class PublicItemOutput(serializers.ModelSerializer):
    """Serializer público de un item del menú/catálogo.

    Incluye:
    - ``tiempo_preparacion``: minutos de preparación (null si no está configurado).
    - ``agotado_hoy``: True si el item ya alcanzó su límite diario de ventas.
      El valor es inyectado desde el context['agotados_hoy'] (dict de item_id → bool)
      calculado con UNA query agregada por el selector; si no viene en el contexto
      el campo devuelve False (degradación sin error).
    """

    variantes = VarianteOutput(many=True, read_only=True)
    agotado_hoy = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = (
            "id", "nombre", "descripcion", "precio", "moneda", "imagen",
            "destacado", "etiqueta", "es_paquete", "incluye", "sku",
            "i18n", "tiempo_preparacion", "agotado_hoy", "variantes",
        )

    def get_agotado_hoy(self, obj: Item) -> bool:
        agotados: dict[int, bool] = self.context.get("agotados_hoy", {})
        return agotados.get(obj.pk, False)


class PublicCategoriaOutput(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ("id", "nombre", "orden", "i18n", "items")

    def get_items(self, obj: Categoria) -> Any:
        qs = [i for i in obj.items.all() if i.disponible]
        qs.sort(key=lambda i: i.orden)
        return PublicItemOutput(qs, many=True, context=self.context).data


class PublicColeccionOutput(serializers.ModelSerializer):
    categorias = serializers.SerializerMethodField()

    class Meta:
        model = Coleccion
        fields = ("id", "tipo", "nombre", "orden", "categorias")

    def get_categorias(self, obj: Coleccion) -> Any:
        qs = [c for c in obj.categorias.all() if c.activo]
        qs.sort(key=lambda c: c.orden)
        return PublicCategoriaOutput(qs, many=True, context=self.context).data
