# Changelog — Vitrina Digital

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Sin publicar]

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
