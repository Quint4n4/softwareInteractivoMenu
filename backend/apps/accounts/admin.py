from django.contrib import admin

from .models import Membership, Modulo, Plan, Suscripcion, Tema, Tenant, TenantModulo


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("nombre", "slug", "tipo_negocio", "modo_vitrina", "activo", "plan")
    list_filter = ("tipo_negocio", "modo_vitrina", "activo")
    search_fields = ("nombre", "slug", "dominio_propio")
    prepopulated_fields = {"slug": ("nombre",)}


@admin.register(TenantModulo)
class TenantModuloAdmin(admin.ModelAdmin):
    list_display = ("tenant", "modulo", "activo", "precio_aplicado")
    list_filter = ("activo", "modulo")


admin.site.register(Tema)
admin.site.register(Membership)
admin.site.register(Plan)
admin.site.register(Modulo)
admin.site.register(Suscripcion)
