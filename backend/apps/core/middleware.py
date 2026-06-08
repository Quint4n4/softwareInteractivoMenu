"""
Middleware que resuelve el tenant a partir del host de la petición:
  1) Si el host coincide con un dominio_propio de un Tenant, lo usa.
  2) Si no, toma el subdominio (<slug>.BASE_DOMAIN) y busca por slug.
Si no encuentra tenant (ej. dominio del panel/admin), deja el contexto en None.
"""
from django.conf import settings

from .tenant import clear_current_tenant, set_current_tenant


def resolve_tenant(host):
    # Import diferido para evitar problemas de orden de carga de apps.
    from apps.accounts.models import Tenant

    host = (host or "").split(":")[0].lower()
    if not host:
        return None

    # 1) Dominio propio exacto
    tenant = Tenant.objects.filter(dominio_propio=host, activo=True).first()
    if tenant:
        return tenant

    # 2) Subdominio sobre el dominio base
    base = settings.BASE_DOMAIN.lower()
    if host.endswith("." + base):
        slug = host[: -(len(base) + 1)].split(".")[0]
        return Tenant.objects.filter(slug=slug, activo=True).first()
    return None


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            tenant = resolve_tenant(request.get_host())
        except Exception:
            # Antes de migrar la BD o si algo falla, no rompemos la petición.
            tenant = None
        set_current_tenant(tenant)
        request.tenant = tenant
        try:
            return self.get_response(request)
        finally:
            clear_current_tenant()
