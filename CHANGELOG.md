# Changelog — Qarta

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Sin publicar]

---

## [0.5.0] — 2026-06-12

### Marca — nace "Qarta"

El producto se renombra de **"Vitrina Digital"** a **Qarta** (de QR + carta; *"tu carta, en un QR"*).

**Identidad**
- **Logo**: una lupa sonriente naranja (buscar/ver la carta). Archivos transparentes en `frontend/public/`: `QartaLogo.png` (logo completo), `qarta-icon.png` (solo ícono).
- **Mascota "Qito"**: la misma lupa convertida en personaje amigable (`qito.png`, optimizada de 917 KB a ~70 KB).
- A los PNG con fondo blanco se les quitó el fondo con flood-fill (Pillow) conservando el blanco interior (la carita).

**Integración en el menú del cliente**
- **Splash** con el logo Qarta mientras carga el menú.
- **Qito** en la bienvenida (saludando), en la orden vacía y en un banner de "¡Gracias por tu compra!" al pedir.
- Pie **"Hecho con Qarta"** en todas las pantallas. La marca del restaurante sigue siendo la protagonista; Qarta aparece discreto.

**Rebrand de la plataforma**
- Login con el **ícono del logo** + "Qarta", botón de **ver contraseña** e inputs tipo píldora (estilo glass).
- Headers del panel del dueño y del super-admin con Qito + "Qarta".
- Título de la pestaña "Qarta — Panel" y **favicon** de Qito.

**Docs**
- Nueva guía de marca: [docs/marca.md](docs/marca.md).

---

## [0.4.0] — 2026-06-11

### Añadido

**Super-admin — Planes con módulos y ciclo de cobro**
- Los **planes** ahora son paquetes de **módulos (plugins)** a un precio. Botón **"Planes"** para crear/editar/borrar planes, marcando con casillas qué módulos incluye cada uno.
- Cada plan tiene un **ciclo de cobro**: **Prueba (3 meses)** o **Anual (12 meses)**. Ya no hay planes mensuales.
- Al **asignar un plan** a un negocio se activan **exactamente** sus módulos y se fija el próximo cobro a hoy + el ciclo.
- **"Registrar pago"** avanza el próximo cobro según el ciclo (3 o 12 meses), no un mes fijo.
- El **MRR** se calcula como ingreso mensual equivalente (precio anual ÷ 12; la prueba aporta $0).
- Cuatro planes de ejemplo (`seed_planes`): Prueba, Básico, Pro, Premium.

**Super-admin — Más plugins**
- El catálogo pasó de 5 a **11 módulos**: se agregaron Promociones y cupones, Reseñas y calificaciones, Notificaciones WhatsApp, Reportes y analítica, Inventario y stock y Multi-sucursal.
- **Extras à la carte**: además de los del plan, se pueden activar plugins sueltos por negocio (botón "Gestionar").

**Super-admin — Rediseño glass y tarjeta de negocio**
- Rediseño visual **glassmorphism** (acento naranja, tarjetas esmeriladas, fondo de imagen) en el tablero, con **gráfica de ventas** (6 meses), **4ª tarjeta "Por cobrar este mes"** y **calendario de cobros**.
- La tarjeta de cada negocio se reorganizó en secciones (**Plan · Cobro · Plugins**) con los **plugins activos visibles como chips** y una barra de acciones aparte.

**Login — Rediseño glass**
- Login con estilo **glassmorphism** (tarjeta traslúcida, inputs tipo píldora), **botón para ver la contraseña**, y **fondo de imagen** tanto en el login como en el dashboard.

**Interfaz**
- Todas las confirmaciones nativas del navegador (`confirm`) se reemplazaron por **modales** propios (`ConfirmProvider` / `useConfirm`).

### Técnico
- Migraciones `accounts`: `0004_plan_modulos` (M2M plan↔módulos), `0005_alter_modulo_clave` (nuevos plugins), `0006_plan_ciclo`.
- `AdminTenantOutput` incluye `modulos_activos` (con prefetch, sin N+1).

---

## [0.3.0] — 2026-06-11

### Añadido

**Panel del dueño — QR y Mesas (fusionado)**
- La sección lateral **"Mesas"** desaparece; queda una sola sección **"QR y Mesas"** que agrupa en pantalla el QR general arriba y los QR por mesa abajo.
- El QR general se reetiqueta como **"QR general (para llevar y compartir)"**: sirve para pedidos para llevar, publicarlo en redes sociales o ponerlo en la puerta/mostrador (antes el texto decía "ponlo en tus mesas", lo que era incorrecto).
- Los QR de mesa siguen generándose igual: uno por cada mesa, apuntando a `/v/<slug>?mesa=N`.

**Panel del dueño — Ventas**
- Cada pedido en la lista de Ventas tiene ahora un botón **"Ver"** que abre un modal con la **orden completa**: platillos (cantidad, nota, importe), subtotal, propina, total, y los botones Imprimir y WhatsApp dentro del propio modal.

**Super-admin — Tablero de plataforma**
- Tres tarjetas de resumen al inicio del panel de plataforma:
  - **Negocios**: total de negocios · activos · vencidos.
  - **Ingreso mensual (MRR)**: suma de los precios de planes y add-ons de los negocios activos.
  - **Ventas de la plataforma**: suma de todos los pedidos no cancelados de todos los negocios + número de pedidos.
- Alimentado por el nuevo endpoint `GET /api/admin/stats/`.

**Super-admin — Cobros / Suscripciones**
- Cada tarjeta de negocio muestra ahora una fila de suscripción con:
  - **Estado de pago** (chip): `Prueba` (sin fecha registrada), `Al corriente` (fecha futura), `Vencido` (fecha ya pasada).
  - **Próximo cobro**: campo de fecha editable (calendario); se guarda vía `PATCH /api/admin/negocios/<id>/`.
  - **Botón "Registrar pago"**: adelanta `proximo_cobro` exactamente un mes y reactiva el negocio si estaba suspendido; llama a `POST /api/admin/negocios/<id>/pago/`.

**Super-admin — Soporte / Reset de contraseña**
- Botón **"Contraseña"** en cada tarjeta de negocio: genera una contraseña temporal segura para el dueño y la muestra al super-admin en un modal con botón "Copiar". El dueño puede cambiarla al entrar. Llama a `POST /api/admin/negocios/<id>/reset-password/`.

**Backend**
- Campo `Tenant.proximo_cobro` (`DateField`, opcional/nulo): fecha del próximo cobro de la suscripción. Migración `accounts/0003_tenant_proximo_cobro`.
- `AdminTenantOutput` expone `proximo_cobro` y el campo derivado `estado_pago` (`prueba` / `al_corriente` / `vencido`).
- `AdminTenantUpdateInput` acepta `proximo_cobro` en el `PATCH`.
- Endpoint `GET /api/admin/stats/` (`IsPlatformAdmin`): devuelve `{ negocios_total, negocios_activos, negocios_suspendidos, negocios_vencidos, mrr, ventas_total, pedidos_total }`.
- Endpoint `POST /api/admin/negocios/<id>/pago/` (`IsPlatformAdmin`): registra pago, adelanta `proximo_cobro` un mes, reactiva el negocio y devuelve el negocio actualizado.
- Endpoint `POST /api/admin/negocios/<id>/reset-password/` (`IsPlatformAdmin`): genera contraseña temporal y devuelve `{ password }`.

### Cambiado

- La entrada lateral "QR" y "Mesas" son ahora una sola entrada **"QR y Mesas"** en el menú lateral del panel del dueño.
- El título de la sección QR cambia de "Código QR de tu vitrina" a "QR general (para llevar y compartir)" para distinguirlo de los QR por mesa.

### Pendiente conocido

- **Suspensión automática de negocios vencidos**: el campo `proximo_cobro` y el estado `vencido` ya existen, pero la suspensión automática requiere una tarea programada (cron/Celery beat). Se implementará en el despliegue a producción.
- **Token JWT del dueño en `localStorage`**: pendiente de migrar a cookies `httpOnly` al desplegar con HTTPS (ver entrada [0.2.0] para contexto).

---

## [0.2.0] — 2026-06-10

### Añadido

**Vitrina pública (cliente)**
- Pantalla de inicio con categorías en tarjetas grandes con imagen; el logo del negocio aparece en la cabecera.
- Navegación por categoría: el cliente toca una tarjeta, ve solo los productos de esa categoría y usa un botón "Atrás" para volver. Ya no existe la lista larga de todas las categorías juntas ni el buscador.
- Paleta de color viva inspirada en comida (Tomate, Mandarina, Mango, Aguacate, Pistache, Fresa, Mora, Arándano); el acento usa el color del negocio.
- El carrito ahora persiste en `localStorage` con la clave `vd_cart_<slug>`; no se pierde al recargar la página.
- Pantalla de seguimiento: botón "Ver / enviar ticket" que muestra el recibo al cliente (solo lectura).
- Campo WhatsApp en el checkout (opcional); se guarda en el pedido para que el negocio le envíe el ticket.
- QR por mesa: si la URL incluye `?mesa=N` (ej. `/v/prueba?mesa=5`), la pantalla de bienvenida llega con la mesa prellenada; el cliente solo escribe su nombre.

**Panel del dueño (admin)**
- Sección nueva **Ventas**: tarjetas de resumen (ventas totales, número de pedidos, ticket promedio) y lista de pedidos con botones "Imprimir" y "WhatsApp".
- Botón **Imprimir** en Ventas y Cocina: usa `window.print()` del navegador; desde el diálogo de impresión se puede guardar como PDF.
- Botón **WhatsApp** en Ventas y Cocina: abre `wa.me` con el ticket pre-escrito en el cuerpo; el encargado lo envía desde su cuenta de WhatsApp. Se deshabilita si el pedido no tiene teléfono.
- Barra **Mesas ocupadas** en Cocina: muestra un botón "Liberar mesa" por cada mesa con pedidos activos; al confirmar, marca esos pedidos como entregados.
- Sección nueva **Mesas**: el dueño registra cuántas mesas tiene el negocio (`num_mesas`) y la app genera un QR descargable por cada una, apuntando a `/v/<slug>?mesa=N`.

**Backend**
- Campo `Pedido.telefono` (`CharField`, opcional): WhatsApp del cliente; se acepta al crear el pedido y se devuelve en la respuesta. Migración `orders/0004_pedido_telefono`.
- Campo `Tenant.num_mesas` (`PositiveIntegerField`, default `0`): número de mesas del negocio; editable vía `PATCH /auth/branding/`. Migración `accounts/0002_tenant_num_mesas`.

### Cambiado

**Vitrina pública (cliente)**
- La pestaña inferior "Menú" se elimina; las pestañas quedan: **Inicio · Orden · Pedido**.
- El término "Carrito" se renombra a **"Orden"** en toda la interfaz de la vitrina.
- Tipografía limpia tipo sistema (sans-serif); se quitaron la fuente serif Playfair Display y la cursiva Sacramento.
- Los productos se muestran en cuadrícula (imagen arriba, nombre y precio abajo).

**Panel del dueño (admin)**
- La sección Branding ya no tiene selector de tipografía; la fuente del admin es fija.

### Pendiente conocido (trabajo futuro)

- El token JWT del dueño vive en `localStorage` (`vd_access` / `vd_refresh`). Antes del despliegue a producción se debe migrar a cookies `httpOnly` para eliminar el vector XSS. Requiere HTTPS + manejo de CSRF. Por ahora es aceptable con las protecciones XSS actuales.
- El envío automático del ticket PDF al cliente por WhatsApp (desde el número de la empresa) requeriría la API de WhatsApp Business (de paga); se decidió no usarla en esta fase. El flujo actual es manual: el encargado descarga el PDF y lo adjunta a mano si lo necesita.

---

## [0.1.0] — 2026-06-04 *(commit 1914d89)*

### Añadido

- Arquitectura base: Django + DRF + PostgreSQL + React/Vite/TypeScript, dockerizado.
- Multi-tenant con modelo `Tenant`; cada negocio tiene su propio slug y vitrina en `/v/<slug>`.
- Panel del dueño: editor de menú (categorías, platillos, fotos, variantes, arrastrar para reordenar), sección Marca (logo, color de acento), QR descargable, tablero Cocina.
- Vitrina pública: menú por QR, multi-idioma ES/EN, modo tienda (catálogo).
- Plataforma super-admin: alta/suspensión de negocios, planes y módulos (add-ons).
- Módulo Catálogo: el dueño crea productos; el cliente compra desde la vitrina; el dueño gestiona los pedidos.
