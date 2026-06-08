from django.contrib import admin

from .models import Mesa, Pago, Pedido, PedidoItem


class PedidoItemInline(admin.TabularInline):
    model = PedidoItem
    extra = 0


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("numero", "nombre_cliente", "tipo", "estado", "total", "tenant", "creado")
    list_filter = ("estado", "tipo")
    search_fields = ("numero", "nombre_cliente")
    inlines = [PedidoItemInline]


admin.site.register(Mesa)
admin.site.register(Pago)
