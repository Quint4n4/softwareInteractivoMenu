# Referencia de la API

Base URL en desarrollo: `http://localhost:8001/api`

## Autenticación

JWT (Bearer). Tras el login se obtienen `access` y `refresh`. En cada petición
protegida se envía:

```
Authorization: Bearer <access>
```

El cliente del frontend renueva el `access` automáticamente con el `refresh` cuando
caduca (respuesta 401).

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register/` | — | Crea **usuario dueño + negocio + tema + membresía**; devuelve tokens |
| POST | `/auth/token/` | — | Login: `{username, password}` → `{access, refresh}` |
| POST | `/auth/token/refresh/` | — | Renueva el `access` |
| GET | `/auth/me/` | dueño | Usuario + negocio + rol + `is_platform_admin` + `modulos` activos |

## Panel del dueño — Marca

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/auth/branding/` | Datos del negocio + tema (colores, logo) |
| PATCH | `/auth/branding/` | Actualiza negocio (`nombre`, `modo_vitrina`, `idiomas`, `idioma_default`, `num_mesas`) y/o tema |
| POST | `/auth/branding/logo/` | Sube/reemplaza el logo (multipart, campo `logo`) |
| DELETE | `/auth/branding/logo/` | Quita el logo |

`TenantOutput` incluye ahora el campo `num_mesas` (entero, >= 0). `TenantUpdateInput` acepta `num_mesas` en el PATCH.

## Panel del dueño — Catálogo (menú y tienda)

Todas filtran por el negocio del usuario. Sirven tanto para el menú (`tipo=menu`) como
para el catálogo (`tipo=catalogo`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/colecciones/` | Listar / crear colección (menú o catálogo) |
| GET/PATCH/DELETE | `/colecciones/<id>/` | Detalle / editar / borrar |
| GET/POST | `/categorias/` | Listar / crear categoría |
| GET/PATCH/DELETE | `/categorias/<id>/` | Detalle / editar / borrar |
| GET/POST | `/items/` | Listar / crear ítem (platillo o producto) |
| GET/PATCH/DELETE | `/items/<id>/` | Detalle / editar / borrar |
| POST | `/items/<id>/disponibilidad/` | Marcar agotado/disponible (estado explícito) |
| POST | `/items/<id>/imagen/` | Subir foto del ítem (multipart, campo `imagen`) |
| GET/POST | `/variantes/` | Listar / crear variante (tamaños/opciones) |
| GET/PATCH/DELETE | `/variantes/<id>/` | Detalle / editar / borrar |

Campos del ítem: `nombre`, `precio`, `descripcion`, `imagen`, `etiqueta`, `destacado`,
`disponible`, `es_paquete`, `incluye[]`, `sku`, `stock`, `i18n` (traducciones), `orden`.

> **Reglas de seguridad:** `disponible`/`destacado` NO se cambian por un PATCH genérico
> (tienen endpoint propio). Reordenar usa el campo `orden`. Las traducciones viven en
> `i18n` (ej. `{"en": {"nombre": "...", "descripcion": "..."}}`).

## Pedidos — Panel (cocina / pedidos del catálogo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/pedidos/?estado=nuevo,en_proceso` | Lista de pedidos del negocio (filtro opcional por estado) |
| POST | `/pedidos/<id>/estado/` | Avanza el estado del pedido |

Cada pedido incluye un campo calculado **`origen`**: `menu`, `catalogo` o `mixto`
(según de dónde vienen sus ítems). Estados: `nuevo → en_proceso → listo → entregado`
(+ `cancelado`).

## Vitrina pública (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/public/<slug>/menu/` | Datos públicos del negocio: `disponible`, `modulos`, `modo_vitrina`, `idiomas`, `tema`, `colecciones` |
| POST | `/public/<slug>/pedidos/` | El cliente crea un pedido |
| GET | `/public/<slug>/pedidos/<numero>/` | Seguimiento del pedido por número |

`disponible` es `false` si el negocio está suspendido. Las colecciones se filtran según `modo_vitrina` y si el módulo **Catálogo** está activo (ver [super-admin.md](super-admin.md)).

### Campos de `POST /public/<slug>/pedidos/`

`PedidoCreateInput` acepta ahora el campo `telefono` (string, opcional). Ejemplo:

```json
{
  "nombre_cliente": "Ana",
  "mesa": "3",
  "tipo": "local",
  "items": [{"item_id": 12, "cantidad": 2}],
  "telefono": "5512345678"
}
```

### Campos de `PedidoOutput`

La respuesta de creación y de seguimiento incluye el campo `telefono` (puede ser `null` si el cliente no lo proporcionó).

## Plataforma — Super-admin (`/api/admin/`)

Requieren `IsPlatformAdmin` (super-usuario de Django). Operan sobre **todos** los negocios.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/negocios/` | Lista todos los negocios |
| POST | `/admin/negocios/` | Da de alta un negocio (crea su dueño) |
| GET/PATCH | `/admin/negocios/<uuid>/` | Detalle / editar (incluye `plan_id` y `proximo_cobro`) |
| POST | `/admin/negocios/<uuid>/suspender/` | Suspende el negocio |
| POST | `/admin/negocios/<uuid>/reactivar/` | Reactiva el negocio |
| POST | `/admin/negocios/<uuid>/pago/` | Registra pago: adelanta `proximo_cobro` un mes y reactiva; devuelve el negocio |
| POST | `/admin/negocios/<uuid>/reset-password/` | Genera contraseña temporal del dueño; devuelve `{ password }` |
| GET | `/admin/negocios/<uuid>/modulos/` | Módulos del negocio y su estado |
| POST | `/admin/negocios/<uuid>/modulos/` | Activa/desactiva un módulo (`{clave, activo}`) |
| GET | `/admin/modulos/` | Catálogo de módulos disponibles |
| GET | `/admin/planes/` | Lista de planes |
| GET | `/admin/stats/` | Métricas globales de la plataforma (tablero del super-admin) |

> Un dueño normal recibe **403** en cualquier ruta `/api/admin/`; sin sesión, **401**.

### `GET /admin/stats/`

Devuelve un objeto con las métricas globales de la plataforma:

```json
{
  "negocios_total": 12,
  "negocios_activos": 9,
  "negocios_suspendidos": 2,
  "negocios_vencidos": 1,
  "mrr": "3580.00",
  "ventas_total": "142300.50",
  "pedidos_total": 874
}
```

- `mrr`: suma de los precios de planes y add-ons de los negocios activos (decimal como string).
- `ventas_total`: suma de todos los pedidos no cancelados de todos los negocios (decimal como string).
- `negocios_vencidos`: negocios cuya `proximo_cobro` ya pasó (independientemente de si están activos o suspendidos).

### Campos de `AdminTenantOutput`

Además de los campos base, cada negocio en la respuesta de `/admin/negocios/` incluye:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `num_mesas` | entero | Número de mesas del negocio |
| `proximo_cobro` | fecha (`YYYY-MM-DD`) o `null` | Fecha del próximo cobro de la suscripción |
| `estado_pago` | string | `prueba` / `al_corriente` / `vencido` (calculado por el backend) |
| `owner_email` | string o `null` | Correo del dueño principal |

`AdminTenantUpdateInput` (PATCH) acepta `proximo_cobro` (fecha o `null`) además de `plan_id`, `tipo_negocio` y `modo_vitrina`.
