# Mordisco · comida rápida en 3D

Web de un local de comida rápida (concepto, datos ficticios) donde el cliente arma su hamburguesa,
perro caliente o pizza en 3D: cada ingrediente cae, se esparce o se vierte con su animación, el precio
cambia al instante y el pedido sale por WhatsApp.

```bash
npm install
npm run dev      # http://localhost:3300
npm run build
```

## Estructura

- `src/three/`: modelos procedurales (sin archivos 3D externos ni texturas en imagen).
  - `Hamburguesa.tsx`: pila de capas; al cambiar algo la tapa sube, la capa cae y la tapa cierra.
  - `Perro.tsx`: salsas en zigzag que se dibujan como saliendo del pomo; repollo, papitas y queso caen.
  - `Pizza.tsx`: la salsa se esparce, la mozzarella cae rallada y se funde, los toppings caen uno a uno.
  - `texturas.ts`: texturas de ruido periódico (sin costuras) generadas en el navegador.
  - `Escena.tsx`: luz de estudio, sombra de contacto y encuadre automático según lo armado.
- `src/ui/Armador.tsx`: armador 3D. `src/ui/Carrito.tsx`: pedido editable y envío por WhatsApp.
- `src/data/menu.ts`: productos, ingredientes y precios (USD, ficticios).
- `public/img/`: fotos del menú (vista 3/4 de las imágenes de referencia).

## Decisiones

- Paleta cálida y apagada: carbón como las fotos de producto, crema para leer, tomate solo en acciones.
- La personalización empieza al elegir el producto; cada línea del pedido se puede editar sin rehacerla.
- El 3D se carga aparte: el texto de la página llega primero (75 KB gzip) y Three.js después.
