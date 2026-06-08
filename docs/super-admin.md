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

## Qué puede hacer

Desde el panel verás la lista de todos los negocios, y por cada uno:

| Acción | Cómo |
|--------|------|
| **Ver** nombre, estado, enlace de vitrina y correo del dueño | en la tarjeta |
| **Suspender / Activar** | botón (la vitrina lo respeta al instante) |
| **Asignar plan** | menú desplegable |
| **Activar/desactivar módulos** | botón "Módulos" → interruptores |
| **Dar de alta un negocio** | botón "Nuevo negocio" (crea el negocio + su dueño) |

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
