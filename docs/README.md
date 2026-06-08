# Documentación — Vitrina Digital (AgencySoftware)

**Vitrina Digital** es un SaaS multi-tenant para restaurantes y comercios: cada
negocio tiene su **menú/catálogo digital por QR**, su panel para administrarlo, y
una plataforma central para dar de alta clientes y vender módulos (add-ons).

- **Backend:** Django + Django REST Framework + PostgreSQL
- **Frontend:** React + TypeScript (Vite)
- **Infra:** Docker (un solo comando levanta todo)

## Índice

| Documento | De qué trata |
|-----------|--------------|
| [arquitectura.md](arquitectura.md) | Stack, multi-tenant, arquitectura por capas, estructura de apps |
| [api.md](api.md) | Referencia de toda la API (auth, catálogo, pedidos, público, plataforma) |
| [panel-del-dueno.md](panel-del-dueno.md) | Guía del panel del dueño: menú, catálogo, marca, QR, cocina, pedidos, métricas |
| [vitrina-publica.md](vitrina-publica.md) | La vitrina que ve el cliente: menú, tienda, idiomas, QR, pedidos |
| [super-admin.md](super-admin.md) | Panel de plataforma: alta de negocios, planes y módulos (add-ons) |
| [desarrollo.md](desarrollo.md) | Cómo correr, pruebas, comandos de datos de demo, variables de entorno |

## Arranque rápido

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Panel del dueño / vitrina | http://localhost:5180 |
| API + admin de Django | http://localhost:8001 (`/admin/`) |

Para una demo con datos cargados, ver [desarrollo.md](desarrollo.md) (comandos `seed_*`).

## Estado del proyecto (resumen)

- ✅ **Cimientos:** Docker, Postgres, JWT, multi-tenant.
- ✅ **Panel del dueño:** editor de menú (con arrastrar para reordenar, fotos, variantes), marca (logo/colores/tipografía), QR descargable, cocina, métricas.
- ✅ **Vitrina pública:** menú por QR, multi-idioma ES/EN, modo tienda (catálogo).
- ✅ **Plataforma (super-admin):** alta/suspensión de negocios, planes, módulos/add-ons.
- ✅ **Módulo Catálogo:** el dueño crea productos → el cliente compra en la tienda → el dueño gestiona los pedidos (empaque/entrega).
- 🔜 **Pendiente:** pago en línea real (fuera del MVP), métricas con eventos reales, despliegue a producción.
