# Seguridad

Resumen de las protecciones de Qarta y lo que falta antes de exponer a internet.

## Rate limiting (límites de tasa)

Toda la API usa throttling de DRF. La configuración vive en
`backend/config/settings.py` → `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`. Al pasarse,
la API responde **HTTP 429**.

| Función | Límite | Se cuenta por |
|---------|--------|---------------|
| Ver menú | 240/min | IP |
| **Crear pedido** | 40/min | **restaurante (slug)** |
| **Seguir pedido** | 400/min | **restaurante (slug)** |
| Login | 8/min | IP |
| Registro | 6/hora | IP |
| Panel del dueño (cocina, edición…) | 600/min | usuario |
| Reset de contraseña (super-admin) | 6/min | usuario |
| Stats de la plataforma | 20/min | usuario |

Los **pedidos se limitan por restaurante** (`backend/apps/orders/throttles.py`), no por
IP. Así no afecta que los clientes compartan el WiFi del local, usen datos móviles o estén
detrás de CGNAT / un proxy: el tope se mide por negocio, que es lo que protege contra
"inundar la cocina" de un restaurante.

## Token de pedido (anti-enumeración)

Cada pedido tiene un `token` opaco de 16 caracteres. El seguimiento público
(`GET /api/public/<slug>/pedidos/<token>/`) se hace por ese token, **no** por el número
secuencial `A-001` (que sigue mostrándose al cliente y a la cocina). Así nadie puede
iterar números y leer el nombre/teléfono de otros clientes. El backend además rechaza
tokens vacíos o muy cortos.

## Otras defensas ya presentes

- **Multi-tenant**: los selectores filtran siempre por `tenant`; responden `404` (no `403`)
  para no revelar la existencia de recursos ajenos.
- **Permisos**: `/api/admin/` exige `IsPlatformAdmin`; el panel del dueño exige membership.
- **Precios server-side**: el total del pedido se calcula con el precio de la BD, no del
  cliente (no se puede manipular desde el frontend).

## Pendiente para producción (despliegue)

- [ ] `DJANGO_DEBUG=False` y `DJANGO_ALLOWED_HOSTS` explícitos (no `*`).
- [ ] CORS restringido a los dominios reales del frontend (hoy abierto en dev).
- [ ] HTTPS + `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, HSTS, cookies httpOnly del token.
- [ ] `X-Forwarded-For` / `NUM_PROXIES` para que el throttling vea la IP real tras el proxy
      (si no, todos cuentan como una sola IP).
- [ ] Cache **Redis** para que el throttling sea exacto entre workers de gunicorn
      (hoy LocMemCache = por proceso).
- [ ] Reset de contraseña del dueño **por correo** (hoy se muestra al super-admin en pantalla).
- [ ] (opcional) `django-axes` para bloqueo por cuenta y blacklist de refresh tokens.
- [ ] (menor) número de pedido atómico para evitar duplicados en alta concurrencia.
