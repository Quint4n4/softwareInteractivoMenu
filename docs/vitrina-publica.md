# Vitrina pública (lo que ve el cliente)

Es la página que el comensal abre al **escanear el QR** del negocio:

```
http://localhost:5180/v/<slug>
```

Ejemplo de la demo: `http://localhost:5180/v/prueba`. En producción sería el subdominio o dominio propio del negocio.

## Flujo del cliente

```
Bienvenida → Inicio (categorías) → Productos de la categoría → Orden → Pedido / Seguimiento
```

1. **Bienvenida:** el cliente escribe su nombre y elige "Comer aquí / Para llevar".  
   Si la URL trae `?mesa=N` (ej. `/v/prueba?mesa=5`), la mesa llega prellenada; el cliente solo escribe su nombre.
2. **Inicio:** el logo del negocio aparece en la cabecera. Debajo, las categorías se muestran como **tarjetas grandes con imagen**.
3. **Productos de la categoría:** al tocar una tarjeta, la pantalla muestra solo los productos de esa categoría en **cuadrícula** (imagen arriba, nombre y precio abajo). Un botón "Atrás" regresa a las categorías.
4. **Orden:** el cliente revisa los artículos agregados, propina, forma de pago y confirma. En el checkout aparece un campo opcional de **WhatsApp** para recibir el ticket.
5. **Seguimiento:** ve el estado de su pedido en vivo (Recibido → En preparación → Listo → Entregado). Desde aquí puede tocar **"Ver / enviar ticket"** para consultar el recibo (solo lectura; no puede imprimirlo ni descargarlo directamente).

## Pestañas inferiores

| Pestaña | Qué muestra |
|---------|-------------|
| **Inicio** | Categorías del menú |
| **Orden** | Artículos agregados (antes llamado "Carrito") |
| **Pedido** | Seguimiento del pedido activo |

> La pestaña "Menú" que existía antes fue reemplazada por "Inicio".

## QR por mesa

Cada mesa del negocio tiene su propio QR generado desde el panel del dueño (sección **Mesas**). La URL incluye el número de mesa:

```
/v/<slug>?mesa=N
```

Cuando el cliente escanea ese QR, la pantalla de bienvenida llega con la mesa ya seleccionada. Aplica solo a sesiones nuevas.

## Persistencia de la orden

La orden del cliente **no desaparece al recargar**. Se guarda en `localStorage` con la clave `vd_cart_<slug>`. Si el cliente cierra la pestaña y vuelve al mismo negocio, sus artículos siguen ahí.

## Tipografía y colores

La vitrina usa tipografía del sistema (sans-serif). La paleta de acento la define el dueño del negocio y se elige entre tonos inspirados en comida: Tomate, Mandarina, Mango, Aguacate, Pistache, Fresa, Mora, Arándano.

> Las fuentes serif (Playfair Display) y cursiva (Sacramento) se quitaron en esta versión.

## Multi-idioma (ES / EN)

Si el negocio activó el inglés, aparece un selector **ES | EN** arriba. Al cambiar:

- El **menú se traduce** (nombres, descripciones, lo que incluye cada paquete) y también los textos de la app.
- Si un platillo no tiene traducción, se muestra en español (respaldo).
- El idioma elegido se **recuerda** para la próxima visita.

## Ticket del cliente

El cliente puede ver su recibo en la pantalla de seguimiento con el botón **"Ver / enviar ticket"**. El recibo muestra los artículos, precios y total. No hay opción de imprimir ni descargar desde la vitrina; esa acción la hace el negocio desde su panel.

Si el cliente dejó su WhatsApp en el checkout, el encargado del negocio le puede enviar el ticket desde la sección **Ventas** o **Cocina** del panel.

## Negocio no disponible

Si el super-admin **suspende** el negocio, la vitrina muestra "Este negocio no está disponible por el momento" en lugar del menú.

## Pedidos y pago

El cliente confirma su pedido y obtiene un número para darle seguimiento. El estado lo actualiza el negocio desde su panel (Cocina / Pedidos).

> El **pago en línea real** (Mercado Pago/Conekta) está **fuera del MVP**: hoy el flujo de pago es simulado.
