# Arquitectura

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Django + Django REST Framework |
| Base de datos | PostgreSQL (SQLite por defecto en desarrollo) |
| Autenticación | JWT (djangorestframework-simplejwt) |
| Frontend | React 18 + TypeScript + Vite |
| Cliente HTTP | axios (con refresh automático de token) |
| Infra | Docker / Docker Compose |

## Estructura del monorepo

```
AgencySoftware/
├── backend/          API Django + DRF
├── frontend/         Panel + vitrina (React + TS)
├── docs/             Esta documentación
├── docker-compose.yml
├── .env.example
└── README.md
```

## Multi-tenant (varios negocios en una sola plataforma)

Cada negocio es un **tenant** (`Tenant`). Todo lo que le pertenece (menú, productos,
pedidos…) lleva un `tenant_id`. El aislamiento se garantiza así:

- **`apps/core/models.py` → `TenantModel`**: clase base de la que heredan todos los
  modelos de negocio. Expone dos managers:
  - `objects` → filtra automáticamente por el tenant del contexto.
  - `all_objects` → sin filtrar (uso de plataforma / super-admin).
- **`apps/core/middleware.py` → `TenantMiddleware`**: resuelve el tenant a partir del
  **host** de la petición (subdominio `<slug>.dominio` o dominio propio). Lo usa la
  **vitrina pública**.
- **`apps/accounts/permissions.py` → `HasTenantAccess`**: en el **panel del dueño**, el
  tenant se resuelve por la **membresía** (`Membership`) del usuario autenticado.
- **`IsPlatformAdmin`**: permiso para el **super-admin de plataforma** (super-usuario de
  Django); opera por encima de todos los tenants.

> **Regla de oro:** un negocio nunca puede ver ni tocar datos de otro. Si se pide un
> recurso de otro tenant, la API responde **404** (no 403), sin revelar su existencia.

## Arquitectura por capas (backend)

```
URLs → Views (delgadas) → Serializers (validar/formatear) → Services/Selectors → Models → DB
```

- **Views:** parsean la petición, llaman a UN servicio/selector y responden. Sin lógica.
- **Serializers:** validan la entrada y dan forma a la salida (entrada y salida separadas).
- **Services (`services.py`):** casos de uso que **escriben** (crear, actualizar, suspender…).
- **Selectors (`selectors.py`):** **lecturas**/consultas con filtros y permisos.
- **Models:** datos y validaciones simples.

Argumentos keyword-only (`*,`) y tipado en las firmas. Pruebas con `pytest`.

## Apps del backend

| App | Responsabilidad | Modelos clave |
|-----|-----------------|---------------|
| `core` | Base multi-tenant | `TenantModel`, manager, middleware |
| `accounts` | Negocios, usuarios, planes, módulos | `Tenant`, `Tema`, `Membership`, `Plan`, `Modulo`, `TenantModulo`, `Suscripcion` |
| `catalog` | Motor de menú **y** catálogo | `Coleccion`, `Categoria`, `Item`, `Variante`, `CodigoQR` |
| `orders` | Pedidos y pagos | `Mesa`, `Pedido`, `PedidoItem`, `Pago` |
| `analytics` | Métricas (modelado) | `EventoVista` |

> Una `Coleccion` tiene un **`tipo`**: `menu` o `catalogo`. La misma estructura
> (colección → categorías → ítems → variantes) sirve para el menú del restaurante y
> para el catálogo de productos de la tienda.

## Estructura del frontend

```
frontend/src/
├── api/          clientes tipados de la API (client, auth, catalog, orders, public, branding, admin)
├── pages/        Login, Panel, Admin, MenuEditor, Branding, QRView, Cocina, Metrics, Vitrina
├── ui/           Icon, PhonePreview, i18n (multi-idioma), brandOptions
├── App.tsx       enruta: super-admin → Admin; dueño → Panel; sin sesión → Login
└── main.tsx      router: /v/:slug → Vitrina ; resto → App
```

Todas las llamadas pasan por el **cliente HTTP central** (`api/client.ts`), que adjunta
el token y **refresca** automáticamente ante un 401. El control de rol en el frontend es
solo UX (ocultar/redirigir); **la autoridad de permisos es el backend**.
