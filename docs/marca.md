# Marca — Qarta

**Qarta** es el nombre del producto (de **Q**R + **carta**). Tagline: *"tu carta, en un QR"*.
El nombre interno del repositorio sigue siendo `AgencySoftware`.

## Logo e ícono

El logo es una **lupa sonriente** dentro de un cuadro naranja: la idea de **buscar / ver**
la carta. Los archivos viven en `frontend/public/`:

| Archivo | Qué es | Dónde se usa |
|---------|--------|--------------|
| `QartaLogo.png` | Logo completo (ícono + palabra "Qarta"), fondo transparente | Splash de carga del menú |
| `qarta-icon.png` | Solo el ícono (la lupa), transparente | Login y favicon |
| `qito.png` | La mascota **Qito** (lupa 3D saludando), transparente y optimizada | Menú (bienvenida, orden vacía, "gracias", pie) y headers de los paneles |

> Las imágenes vienen de un PNG con fondo blanco; se les quitó el fondo con un
> **flood-fill** (relleno desde los bordes) en Pillow para **conservar el blanco interior**
> (la carita de la lupa). El ícono además se recortó del logo y se le limpió la sombra.

## Mascota — Qito

**Qito** es la misma lupa del logo convertida en personaje (cara feliz, cachetes, saludando).
Es el toque cálido de la marca. Aparece **sutil**, sin tapar la marca del restaurante:

- Pantalla de **bienvenida** del menú (saludando).
- Estado de **orden vacía** y "sin pedidos".
- Banner de **"¡Gracias por tu compra!"** al hacer un pedido.
- Pie **"Hecho con Qarta"** en todas las pantallas del menú.
- Marca de los **headers** del panel del dueño y del super-admin.

## Color

- Acento principal: **naranja `#f97316`** (degradado a `#fb923c`).
- Texto de marca: gris muy oscuro `#2a2520`.

## Fondos

- `login-bg.jpg` — ondas beige, fondo del **login** (efecto glass).
- `dashboard-bg.jpg` — ondas, fondo del **super-admin** (efecto glass).

## Dónde NO va la marca grande

En el **menú del cliente** manda la marca del **restaurante** (su logo y nombre). Qarta/Qito
aparecen discretos (splash breve, pie "Hecho con Qarta", Qito en momentos del sistema). La
marca Qarta **en grande** vive en el **login** y los **paneles**.

## Regenerar / quitar fondo a una imagen

Si subes un PNG nuevo con fondo blanco y quieres quitarlo conservando el interior:

```bash
docker cp tu_imagen.png agencysoftware-backend-1:/tmp/img.png
# script Pillow: flood-fill near-white desde los bordes → alpha 0
docker cp agencysoftware-backend-1:/tmp/out.png frontend/public/tu_imagen.png
```
