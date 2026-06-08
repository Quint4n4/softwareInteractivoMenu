# AgencySoftware — Vitrina Digital (SaaS multi-tenant)

Monorepo dockerizado. Backend Django + DRF, frontend React + TypeScript (Vite),
base de datos PostgreSQL. Todo corre en contenedores con un solo comando.

```
AgencySoftware/
├── backend/          API Django + DRF (multi-tenant, arquitectura limpia)
├── frontend/         Panel React + TypeScript (Vite)
├── docs/             Documentación del proyecto
├── docker-compose.yml
└── .env.example
```

## Requisitos

- Docker Desktop (incluye Docker Compose).

## Arranque

```bash
cp .env.example .env        # ajusta valores si quieres
docker compose up --build
```

Esto levanta tres servicios:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| frontend | http://localhost:5180 | Panel del dueño (login) |
| backend  | http://localhost:8001 | API + admin de Django (`/admin/`) |
| db       | localhost:5432 | PostgreSQL (datos en volumen `pgdata`) |

El backend corre las migraciones solo al iniciar.

## Primer uso

1. Abre http://localhost:5180
2. Clic en **“¿No tienes cuenta? Crea tu negocio”** y regístrate
   (esto crea usuario + negocio + membresía vía `/api/auth/register/`).
3. Entras al panel y ves los datos de tu negocio. 🎉

Para un superusuario del admin de Django:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Documentación

La documentación completa está en [`docs/`](docs/README.md): arquitectura, referencia
de la API, y guías del panel del dueño, de la vitrina pública y del panel de plataforma.

## Estado

Producto funcional con: panel del dueño (menú, **catálogo**, marca, QR, cocina,
**pedidos**, métricas), vitrina pública por QR con **multi-idioma ES/EN** y **modo
tienda**, y panel **super-admin** de plataforma (negocios, planes, módulos/add-ons).
Pendiente: pago en línea real, métricas con eventos reales y despliegue a producción.

## Notas

- El backend sigue la skill `django-clean-architecture` (services/selectors,
  vistas delgadas, tipado, tests). Tests: `docker compose exec backend pytest`.
- En producción: pon `DJANGO_DEBUG=False` (el backend cambia a gunicorn) y
  restringe `DJANGO_ALLOWED_HOSTS` y CORS.
