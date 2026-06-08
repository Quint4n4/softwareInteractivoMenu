# Panel del dueño

El dueño de un negocio entra en **http://localhost:5180** con su usuario y contraseña.
Ahí administra todo su negocio. Las secciones del menú lateral son:

## 🍽️ Menú

Editor del menú del restaurante:

- Crear **categorías** y **platillos** (con foto, precio, descripción, variantes).
- **Arrastrar para reordenar** platillos dentro de una categoría (o usar las flechas ↑↓).
- Marcar **agotado** (se refleja al instante en la vitrina) y **destacado** (favorito).
- **Paquetes/combos**: lista de "lo que incluye".
- **Variantes**: tamaños u opciones con precio extra (ej. Chico/Grande).
- **Vista previa en vivo** de cómo se verá en la vitrina.
- **Traducción al inglés** (si el idioma está activo): nombre y descripción por platillo,
  y nombre por categoría. Lo vacío se muestra en español (respaldo).

## 🛍️ Catálogo *(solo si el módulo está activo)*

Mismo editor, pero para **productos** de la tienda. Aparece únicamente cuando el
super-admin activa el módulo **Catálogo** para el negocio. Además de lo anterior, los
productos tienen **SKU (código)** y **stock**.

> El menú y el catálogo son colecciones distintas (`tipo=menu` / `tipo=catalogo`) pero
> usan el mismo editor.

## 🎨 Marca

Identidad visual de la vitrina:

- **Logo** (se muestra circular en la vitrina), **nombre** del negocio.
- **Color de acento** y **tipografía** de títulos.
- **Idiomas de la vitrina**: interruptor para activar **Inglés** (muestra el botón ES/EN
  a los clientes). El español es la base.

## 📱 QR

Genera el **código QR** de la vitrina del negocio. Se puede **descargar en PNG** y
copiar el enlace. Se imprime y se pone en las mesas o el mostrador.

## 🔥 Cocina

Tablero tipo *kanban* de los pedidos del restaurante, en tiempo real (se refresca solo):

```
Recibido → En preparación → Listo → Entregado
```

Cada tarjeta muestra el número de pedido, cliente, mesa/para llevar y los platillos. Un
botón avanza el pedido al siguiente estado.

## 📦 Pedidos *(solo si el módulo Catálogo está activo)*

El mismo tablero, pero para los **pedidos de la tienda**, con estados de empaque:

```
Recibido → Empacando → Listo para recoger → Entregado
```

Muestra los pedidos que contienen productos del catálogo. (Un pedido mixto —menú +
producto— aparece en ambos tableros con el mismo estado.)

## 📈 Métricas

Resumen del menú (platillos activos, destacados, etc.).

> Nota: por ahora las métricas se derivan del menú; aún no capturan eventos reales de
> vistas (eso es trabajo de una fase posterior).
