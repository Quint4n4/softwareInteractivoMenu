# Panel de plataforma (super-admin)

El **super-admin** es el dueño de la plataforma (tú): administra **todos** los negocios
clientes y vende módulos (add-ons). Es distinto del dueño de un negocio.

## Acceso

- Es un **super-usuario de Django** (`is_superuser`). Se crea con:
  ```bash
  docker compose exec backend python manage.py createsuperuser
  ```
- Al entrar en **http://localhost:5180** con ese usuario, el sistema muestra el **panel de
  plataforma** (no el panel de negocio). La decisión la toma `/auth/me/` con el campo
  `is_platform_admin`.

## Tablero de plataforma

Al cargar el panel, arriba de la lista de negocios aparecen tres tarjetas de resumen:

| Tarjeta | Qué muestra |
|---------|-------------|
| **Negocios** | total · activos · vencidos |
| **Ingreso mensual (MRR)** | ingreso mensual equivalente de negocios activos (precio anual ÷ 12; la prueba aporta $0) |
| **Ventas de la plataforma** | suma de todos los pedidos no cancelados de todos los negocios + número de pedidos |
| **Por cobrar este mes** | suma de planes de negocios vencidos o que vencen este mes |

Estos datos los devuelve el endpoint `GET /api/admin/stats/`. Debajo de las tarjetas hay una **gráfica de ventas** (últimos 6 meses) y un **calendario de cobros** que resalta los días en que vence algún negocio.

## Qué puede hacer

Desde el panel verás la lista de todos los negocios, y por cada uno:

| Acción | Cómo |
|--------|------|
| **Ver** nombre, estado, enlace de vitrina y correo del dueño | en la tarjeta |
| **Suspender / Activar** | botón (la vitrina lo respeta al instante) |
| **Asignar plan** | menú desplegable (activa los módulos del plan y fija el próximo cobro) |
| **Ver plugins activos** | chips en la propia tarjeta (sin abrir nada) |
| **Activar extras (plugins) sueltos** | botón "Gestionar" → interruptores |
| **Crear/editar planes** | botón **"Planes"** (ver sección "Planes") |
| **Dar de alta un negocio** | botón "Nuevo negocio" (crea el negocio + su dueño) |
| **Resetear contraseña del dueño** | botón "Contraseña" → se genera y muestra una contraseña temporal |

## Cobros y suscripciones

Cada tarjeta de negocio muestra una fila de suscripción con tres elementos:

**Estado de pago** (chip de color)

| Estado | Condición |
|--------|-----------|
| `Prueba` | No se ha registrado ninguna fecha de próximo cobro |
| `Al corriente` | La fecha de próximo cobro es hoy o está en el futuro |
| `Vencido` | La fecha de próximo cobro ya pasó |

**Próximo cobro** — campo de calendario editable. Al cambiar la fecha se guarda de inmediato vía `PATCH /api/admin/negocios/<id>/` con el campo `proximo_cobro`.

**Botón "Registrar pago"** — llama a `POST /api/admin/negocios/<id>/pago/`. Adelanta `proximo_cobro` según el **ciclo del plan** (prueba: 3 meses · anual: 12 meses) y, si el negocio estaba suspendido, lo reactiva en ese mismo paso. Al **asignar un plan** también se fija automáticamente el próximo cobro a hoy + el ciclo.

> La **suspensión automática** al vencerse la fecha aún no existe: requiere una tarea programada (cron). Por ahora el estado `Vencido` es solo informativo; la suspensión la hace manualmente el super-admin con el botón "Suspender". Se implementará en el despliegue a producción.

## Soporte — Reset de contraseña

El botón **"Contraseña"** en cada tarjeta llama a `POST /api/admin/negocios/<id>/reset-password/`. El backend genera una contraseña temporal segura y la devuelve en un modal con botón "Copiar". El super-admin se la comparte al dueño por el canal que prefiera; el dueño puede cambiarla al entrar desde su perfil.

## Planes

Un **plan** es un paquete de módulos a un precio y un ciclo de cobro. Se gestionan con el
botón **"Planes"** (crear, editar, borrar):

| Campo | Detalle |
|-------|---------|
| **Nombre** | ej. Básico, Pro, Premium |
| **Tipo de cobro (ciclo)** | **Prueba** (3 meses) o **Anual** (12 meses) |
| **Precio** | lo que se cobra por ciclo (la prueba suele ir en 0) |
| **Módulos incluidos** | casillas con los plugins que trae el plan |

Al **asignar un plan** a un negocio se activan **exactamente** sus módulos y se fija el
próximo cobro. Endpoints: `POST /api/admin/planes/`, `PATCH`/`DELETE /api/admin/planes/<id>/`.

Cuatro planes de ejemplo se crean con:
```bash
docker compose exec backend python manage.py seed_planes
```

## Módulos / plugins

Los módulos (plugins) son funciones que se activan por negocio (modelo `TenantModulo`).
El catálogo trae **11**: Menú, Catálogo, Order & Pay, Reservas, Fidelización,
Promociones y cupones, Reseñas y calificaciones, Notificaciones WhatsApp,
Reportes y analítica, Inventario y stock y Multi-sucursal.

- Los módulos que trae el **plan** se activan solos al asignarlo.
- Además, el super-admin puede activar **extras** sueltos por negocio con el botón
  **"Gestionar"** (se reinician si se reasigna el plan).
- Al **activar el Catálogo**, el dueño ve la pestaña **Catálogo** y la vitrina muestra la **tienda**.

El catálogo de módulos se crea/actualiza con:
```bash
docker compose exec backend python manage.py seed_modulos
```

## Seguridad

- Todas las rutas `/api/admin/` exigen `IsPlatformAdmin`. Un **dueño normal recibe 403**;
  sin sesión, **401**. Hay pruebas automatizadas que lo verifican.
- El control en el frontend (mostrar el panel solo a super-admins) es **solo UX**: la
  autoridad real es el backend.
