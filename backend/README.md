# Backend — Vitrina Digital (SaaS multi-tenant)

Django + Django REST Framework + PostgreSQL. Multi-tenant por esquema compartido
(`tenant_id` en cada tabla, resuelto por el host de la petición).

## Puesta en marcha (desarrollo)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # ajusta valores

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Por defecto usa SQLite. Para PostgreSQL, pon `DB_ENGINE=postgres` y los datos de
conexión en `.env`.

## Estructura

```
config/            settings, urls, wsgi/asgi
apps/core/         base multi-tenant: TenantModel, manager, middleware
apps/accounts/     Tenant, Tema, Membership, Plan, Modulo, TenantModulo, Suscripcion
apps/catalog/      Coleccion, Categoria, Item, Variante, CodigoQR  (motor menú+catálogo)
apps/orders/       Mesa, Pedido, PedidoItem, Pago  (FASE 2, modelado)
apps/analytics/    EventoVista
```

## API base

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register/` | Crea dueño + negocio + membresía, devuelve tokens |
| POST | `/api/auth/token/` | Login (JWT): devuelve access/refresh |
| POST | `/api/auth/token/refresh/` | Renueva el access token |
| GET | `/api/auth/me/` | Usuario + negocio del token |
| CRUD | `/api/colecciones/` `/api/categorias/` `/api/items/` `/api/variantes/` | Panel del dueño (tenant-scoped) |
| GET | `/api/public/<slug>/menu/` | Vitrina pública del negocio (sin auth) |

Todas las rutas del panel filtran por la membresía del usuario autenticado: un
negocio nunca puede ver ni tocar datos de otro.

## Cómo se resuelve el tenant

- **Vitrina pública:** por subdominio (`<slug>.BASE_DOMAIN`) o `dominio_propio`
  (middleware en `apps/core/middleware.py`).
- **Panel del dueño:** por la `Membership` del usuario autenticado.

## Multi-tenant: managers

- `Modelo.objects` → filtra por el tenant del contexto (vitrina pública).
- `Modelo.all_objects` → sin filtrar (super-admin / panel, que luego filtra por membresía).
