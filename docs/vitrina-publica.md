# Vitrina pública (lo que ve el cliente)

Es la página que el comensal abre al **escanear el QR** del negocio:

```
http://localhost:5180/v/<slug>
```

(ejemplo de la demo: `http://localhost:5180/v/prueba`). En producción sería el
subdominio o dominio propio del negocio.

## Flujo del cliente

```
Bienvenida → Inicio → Menú / Tienda → Carrito → Seguimiento del pedido
```

1. **Bienvenida (intake):** el cliente pone su nombre y elige "Comer aquí / Para llevar".
2. **Inicio:** logo del negocio, botón para ver el menú/tienda, categorías y destacados.
3. **Menú / Tienda:** explora los productos, busca, abre el detalle, agrega al carrito.
4. **Carrito:** revisa, propina, forma de pago, confirma.
5. **Seguimiento:** ve el estado de su pedido en vivo (Recibido → … → Entregado).

## Multi-idioma (ES / EN)

Si el negocio activó el inglés, aparece un selector **ES | EN** arriba. Al cambiar:

- El **menú se traduce** (nombres, descripciones, lo que incluye cada paquete) y también
  los textos de la app.
- Si un platillo no tiene traducción, se muestra en español (respaldo).
- El idioma elegido se **recuerda** para la próxima visita.

## Modo tienda (catálogo)

Según el **modo de negocio** y los módulos activos, la vitrina muestra:

- **Solo Menú:** la carta del restaurante (lista de platillos).
- **Solo Catálogo:** la tienda (cuadrícula de productos para recoger).
- **Ambos:** pestañas **Menú / Tienda** para alternar. La tienda muestra los productos en
  **cuadrícula** con foto, precio y variantes.

El carrito es **compartido** entre Menú y Tienda: el cliente puede pedir un café y una
bolsa de grano en el mismo pedido.

## Negocio no disponible

Si el super-admin **suspende** el negocio, la vitrina muestra "Este negocio no está
disponible por el momento" en lugar del menú.

## Pedidos y pago

El cliente confirma su pedido y obtiene un número para darle seguimiento. El estado lo
actualiza el dueño desde su panel (Cocina / Pedidos).

> El **pago en línea real** (Mercado Pago/Conekta) está **fuera del MVP**: hoy el flujo
> de pago es simulado.
