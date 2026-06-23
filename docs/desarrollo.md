# Guía de desarrollo

## Correr el proyecto (Docker — recomendado)

```bash
cp .env.example .env        # crea tu .env (NO está en el repo, por seguridad)
docker compose up --build
```

| Servicio | URL | Notas |
|----------|-----|-------|
| frontend | http://localhost:5180 | Panel + vitrina (Vite). Reinstala deps al arrancar (~1 min) |
| backend | http://localhost:8001 | API + admin de Django (`/admin/`). Migra solo al iniciar |
| db | interno | PostgreSQL, datos en el volumen `pgdata` |

> El puerto del frontend es **5180** (se movió del 5173 porque chocaba con otro
> proyecto local). El backend es **8001** (mapea al 8000 del contenedor).

Comandos dentro de los contenedores:
```bash
docker compose exec backend python manage.py <comando>
docker compose exec backend python manage.py createsuperuser   # super-admin de plataforma
docker compose exec backend python manage.py changepassword <usuario>
```

## Correr el backend solo (sin Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # o requirements-dev.txt para pruebas
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Por defecto usa SQLite. Para PostgreSQL: `DB_ENGINE=postgres` + datos de conexión en `.env`.

## Datos de demo (comandos `seed_*`)

Para tener un negocio de ejemplo ("Canela & Café", slug `prueba`):

```bash
# 1) Crear el negocio (regístralo desde la app, o crea un superusuario)
# 2) Poblar el menú demo
docker compose exec backend python manage.py seed_canela --slug prueba --rename
# 3) Cargar las fotos de los platillos
docker compose exec backend python manage.py seed_fotos
# 4) Traducciones al inglés + activar idiomas ES/EN
docker compose exec backend python manage.py seed_i18n --slug prueba
# 5) Crear el catálogo de módulos (Menú, Catálogo, etc.)
docker compose exec backend python manage.py seed_modulos
# 6) Crear los planes de ejemplo (Prueba / Básico / Pro / Premium)
docker compose exec backend python manage.py seed_planes
```

## Copia exacta de los datos (dump + imágenes) — para compartir

Si quieres que otra persona vea **exactamente** tus datos (no solo el demo seed):

**Generar la copia** (en la máquina que tiene los datos):
```bash
docker compose exec backend python manage.py dumpdata --natural-foreign --natural-primary \
  --indent 2 -e contenttypes -e auth.permission -e admin.logentry -e sessions.session \
  -o demo_data.json
```
Crea `backend/demo_data.json`. Las imágenes viven en `backend/media/` (no están en git).
Comprime ambos para enviarlos: `demo_data.json` + la carpeta `media/`.

**Cargar la copia** (en la otra máquina, ya con el repo clonado y `docker compose up`):
```bash
# 1) copia la carpeta media/ del zip dentro de backend/
# 2) copia demo_data.json dentro de backend/
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py loaddata demo_data.json
```
Los usuarios vienen en el dump (con sus contraseñas), así que se entra con las mismas credenciales.

## Pruebas (pytest)

Las dependencias de prueba **no están en la imagen Docker** (solo las de producción).
Para correr las pruebas, instálalas en el contenedor y ejecuta:

```bash
docker compose exec backend pip install pytest pytest-django factory_boy
docker compose exec backend python -m pytest apps -q
```

Cobertura: servicios, selectors y APIs de cada app, incluyendo **aislamiento
multi-tenant** y permisos de plataforma (un dueño no puede entrar al panel super-admin).

Typecheck del frontend:
```bash
docker compose exec frontend npx tsc --noEmit
```

## Variables de entorno (`.env`)

| Variable | Para qué |
|----------|----------|
| `DJANGO_SECRET_KEY` | Clave secreta de Django (**nunca** se sube a git) |
| `DJANGO_DEBUG` | `True` en desarrollo; `False` en producción (usa gunicorn) |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos (restringir en producción) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Conexión a PostgreSQL |
| `VITE_API_URL` | URL de la API que usa el frontend (`http://localhost:8001/api`) |

> ⚠️ El archivo `.env` está en `.gitignore` y **no está en el repositorio**. Cada quien
> debe crear el suyo copiando `.env.example`.

## Managers multi-tenant (recordatorio)

- `Modelo.objects` → filtra por el tenant del contexto (vitrina pública).
- `Modelo.all_objects` → sin filtrar (plataforma / panel, que luego filtra por membresía).

## Producción (pendiente)

Para desplegar: `DJANGO_DEBUG=False` (el backend cambia a gunicorn), restringir
`DJANGO_ALLOWED_HOSTS` y CORS, usar PostgreSQL administrado y almacenamiento de medios en
la nube (S3/R2). El despliegue a producción aún está pendiente.
