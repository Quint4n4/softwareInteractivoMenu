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
| **Ingreso mensual (MRR)** | suma de los precios de planes y add-ons de negocios activos |
| **Ventas de la plataforma** | suma de todos los pedidos no cancelados de todos los negocios + número de pedidos |

Estos datos los devuelve el endpoint `GET /api/admin/stats/`.

## Qué puede hacer

Desde el panel verás la lista de todos los negocios, y por cada uno:

| Acción | Cómo |
|--------|------|
| **Ver** nombre, estado, enlace de vitrina y correo del dueño | en la tarjeta |
| **Suspender / Activar** | botón (la vitrina lo respeta al instante) |
| **Asignar plan** | menú desplegable |
| **Activar/desactivar módulos** | botón "Módulos" → interruptores |
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

**Botón "Registrar pago"** — llama a `POST /api/admin/negocios/<id>/pago/`. Adelanta `proximo_cobro` exactamente un mes y, si el negocio estaba suspendido, lo reactiva en ese mismo paso.

> La **suspensión automática** al vencerse la fecha aún no existe: requiere una tarea programada (cron). Por ahora el estado `Vencido` es solo informativo; la suspensión la hace manualmente el super-admin con el botón "Suspender". Se implementará en el despliegue a producción.

## Soporte — Reset de contraseña

El botón **"Contraseña"** en cada tarjeta llama a `POST /api/admin/negocios/<id>/reset-password/`. El backend genera una contraseña temporal segura y la devuelve en un modal con botón "Copiar". El super-admin se la comparte al dueño por el canal que prefiera; el dueño puede cambiarla al entrar desde su perfil.

## Módulos / add-ons

Los módulos son funciones que se activan por negocio (modelo `TenantModulo`). El estándar
incluye: **Menú** (base), **Catálogo** (add-on de pago), Order & Pay, Reservas,
Fidelización.

- Al **activar el Catálogo** para un negocio, su dueño verá la pestaña **Catálogo** en su
  panel y podrá crear productos; y la vitrina podrá mostrar la **tienda**.
- El precio del add-on se toma del módulo (ej. Catálogo: $199).

El catálogo de módulos se crea con:
```bash
docker compose exec backend python manage.py seed_modulos
```

## Seguridad

- Todas las rutas `/api/admin/` exigen `IsPlatformAdmin`. Un **dueño normal recibe 403**;
  sin sesión, **401**. Hay pruebas automatizadas que lo verifican.
- El control en el frontend (mostrar el panel solo a super-admins) es **solo UX**: la
  autoridad real es el backend.
