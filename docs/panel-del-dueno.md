# Panel del dueño

El dueño de un negocio entra en **http://localhost:5180** con su usuario y contraseña. Ahí administra todo su negocio. Las secciones del menú lateral son:

## Menú

Editor del menú del restaurante:

- Crear **categorías** y **platillos** (con foto, precio, descripción, variantes).
- **Arrastrar para reordenar** platillos dentro de una categoría (o usar las flechas ↑↓).
- Marcar **agotado** (se refleja al instante en la vitrina) y **destacado** (favorito).
- **Paquetes/combos**: lista de "lo que incluye".
- **Variantes**: tamaños u opciones con precio extra (ej. Chico/Grande).
- **Vista previa en vivo** de cómo se verá en la vitrina.
- **Traducción al inglés** (si el idioma está activo): nombre y descripción por platillo, y nombre por categoría. Lo vacío se muestra en español (respaldo).

## Catálogo *(solo si el módulo está activo)*

Mismo editor, pero para **productos** de la tienda. Aparece únicamente cuando el super-admin activa el módulo **Catálogo** para el negocio. Además de lo anterior, los productos tienen **SKU (código)** y **stock**.

> El menú y el catálogo son colecciones distintas (`tipo=menu` / `tipo=catalogo`) pero usan el mismo editor.

## Marca

Identidad visual de la vitrina:

- **Logo** (se muestra circular en la vitrina), **nombre** del negocio.
- **Color de acento** (paleta de tonos de comida: Tomate, Mandarina, Mango, Aguacate, Pistache, Fresa, Mora, Arándano).
- **Idiomas de la vitrina**: interruptor para activar **Inglés** (muestra el botón ES/EN a los clientes). El español es la base.
- **Número de mesas** (`num_mesas`): cuántas mesas tiene el negocio. Se usa en la sección Mesas para generar los QR.

> El selector de tipografía se quitó en esta versión; la fuente del admin es fija.

## QR

Genera el **código QR** de la vitrina del negocio. Se puede **descargar en PNG** y copiar el enlace. Se imprime y se pone en el mostrador.

## Mesas

Genera un **QR descargable por cada mesa**. Cada código apunta a `/v/<slug>?mesa=N`, de modo que cuando el cliente lo escanea, la bienvenida llega con la mesa ya prellenada.

Para configurar el número de mesas: edita el campo **num_mesas** en la sección **Marca** y guarda. Luego vuelve a **Mesas** para ver y descargar los QR generados.

## Cocina

Tablero tipo *kanban* de los pedidos del restaurante, en tiempo real (se refresca solo):

```
Recibido → En preparación → Listo → Entregado
```

Cada tarjeta muestra el número de pedido, cliente, mesa/para llevar y los platillos. Un botón avanza el pedido al siguiente estado.

Funciones adicionales en esta versión:

- **Botón Ticket (Imprimir):** abre el diálogo de impresión del navegador. Desde ahí el encargado puede imprimir o guardar el ticket como PDF.
- **Botón WhatsApp:** abre `wa.me` con el ticket pre-escrito en el cuerpo. El encargado lo envía desde su cuenta personal de WhatsApp. Se deshabilita si el pedido no tiene número de teléfono.
- **Barra "Mesas ocupadas":** muestra un botón **"Liberar mesa"** por cada mesa con pedidos activos. Al confirmar, todos los pedidos de esa mesa pasan a estado Entregado y la mesa queda libre.

## Pedidos *(solo si el módulo Catálogo está activo)*

El mismo tablero, pero para los **pedidos de la tienda**, con estados de empaque:

```
Recibido → Empacando → Listo para recoger → Entregado
```

Muestra los pedidos que contienen productos del catálogo. (Un pedido mixto —menú + producto— aparece en ambos tableros con el mismo estado.)

## Ventas

Resumen de actividad del negocio:

- **Tarjetas de resumen:** ventas totales, número de pedidos, ticket promedio.
- **Lista de pedidos** con detalle de artículos, cliente y mesa.
- **Botón Imprimir:** imprime / guarda como PDF el ticket del pedido desde el navegador.
- **Botón WhatsApp:** abre `wa.me` con el ticket pre-escrito para enviarlo al WhatsApp del cliente. Se deshabilita si el pedido no tiene teléfono registrado.

> Para que el botón WhatsApp funcione, el cliente debe haber dejado su número en el checkout de la vitrina.

## Métricas

Resumen del menú (platillos activos, destacados, etc.).

> Nota: por ahora las métricas se derivan del menú; aún no capturan eventos reales de vistas (eso es trabajo de una fase posterior).

---

## Nota sobre tickets y WhatsApp

El envío de tickets funciona sin API externa:

- **Imprimir / PDF:** `window.print()` del navegador. El encargado elige "Guardar como PDF" en el diálogo.
- **WhatsApp:** enlace `wa.me` con el texto del ticket. El encargado lo envía desde su propio WhatsApp.

Mandar el PDF automáticamente desde el número de empresa requeriría la **API de WhatsApp Business** (de paga). Se decidió no usarla en esta fase.

---

## Nota de seguridad (tokens del dueño)

El token JWT del dueño vive en `localStorage` (`vd_access` / `vd_refresh`). Antes del despliegue a producción se debe migrar a cookies `httpOnly` para eliminar el vector XSS. Requiere HTTPS y manejo de CSRF. Por ahora es aceptable con las protecciones XSS actuales del proyecto.
