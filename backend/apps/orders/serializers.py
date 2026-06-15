"""Serializers de pedidos: entrada y salida separados."""
from rest_framework import serializers

from .models import Pedido, PedidoItem


# --------- Entrada (cliente crea pedido) ---------
class PedidoLineaInput(serializers.Serializer):
    item_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1, default=1)
    notas = serializers.CharField(required=False, allow_blank=True, default="")


class PedidoCreateInput(serializers.Serializer):
    nombre_cliente = serializers.CharField(max_length=120)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    tipo = serializers.ChoiceField(choices=Pedido.Tipo.choices, default=Pedido.Tipo.MESA)
    mesa_texto = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    nota = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    metodo_pago = serializers.ChoiceField(choices=Pedido.MetodoPago.choices, default=Pedido.MetodoPago.EFECTIVO)
    propina = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False, default=0)
    items = PedidoLineaInput(many=True)


# --------- Cambio de estado (panel/cocina) ---------
class PedidoEstadoInput(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Pedido.Estado.choices)


# --------- Salida ---------
class PedidoLineaOutput(serializers.ModelSerializer):
    nombre = serializers.CharField(source="item.nombre", read_only=True)

    class Meta:
        model = PedidoItem
        fields = ("id", "nombre", "cantidad", "precio_unitario", "notas")


class PedidoOutput(serializers.ModelSerializer):
    lineas = PedidoLineaOutput(many=True, read_only=True)
    estado_label = serializers.CharField(source="get_estado_display", read_only=True)
    metodo_pago_label = serializers.CharField(source="get_metodo_pago_display", read_only=True)
    origen = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = (
            "id", "numero", "token", "nombre_cliente", "telefono", "tipo", "mesa_texto", "nota",
            "metodo_pago", "metodo_pago_label", "estado", "estado_label",
            "subtotal", "propina", "total", "creado", "origen", "lineas",
        )

    def get_origen(self, obj: Pedido) -> str:
        """De dónde vienen los ítems del pedido: menú, catálogo o ambos (mixto).
        Se calcula sobre las líneas ya prefetcheadas (sin N+1)."""
        tipos = {
            linea.item.categoria.coleccion.tipo
            for linea in obj.lineas.all()
            if linea.item_id
        }
        if tipos == {"catalogo"}:
            return "catalogo"
        if "catalogo" in tipos:
            return "mixto"
        return "menu"
