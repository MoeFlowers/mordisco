export type ProductoId = 'hamburguesa' | 'perro' | 'pizza'

export type Ingrediente = { id: string; nombre: string; grupo: string; precio: number }

export type Producto = {
  id: ProductoId
  nombre: string
  lema: string
  precioBase: number
  foto: string
  /** Lo que trae la versión de la casa; se arma en este orden al abrir el armador. */
  deLaCasa: string[]
  ingredientes: Ingrediente[]
}

export const PRODUCTOS: Producto[] = [
  {
    id: 'hamburguesa',
    nombre: 'Hamburguesa',
    lema: 'Carne a la brasa, pan brioche con ajonjolí y todo lo que le quieras montar.',
    precioBase: 5.5,
    foto: '/img/hamburguesa.webp',
    deLaCasa: ['salsa-casa', 'lechuga', 'tomate', 'carne', 'queso', 'tocineta', 'huevo'],
    ingredientes: [
      { id: 'salsa-casa', nombre: 'Salsa de la casa', grupo: 'Salsas', precio: 0 },
      { id: 'ketchup', nombre: 'Ketchup', grupo: 'Salsas', precio: 0 },
      { id: 'mostaza', nombre: 'Mostaza', grupo: 'Salsas', precio: 0 },
      { id: 'lechuga', nombre: 'Lechuga', grupo: 'Vegetales', precio: 0 },
      { id: 'tomate', nombre: 'Tomate', grupo: 'Vegetales', precio: 0 },
      { id: 'cebolla', nombre: 'Cebolla', grupo: 'Vegetales', precio: 0 },
      { id: 'carne', nombre: 'Carne', grupo: 'Proteínas', precio: 0 },
      { id: 'carne-extra', nombre: 'Carne extra', grupo: 'Proteínas', precio: 2.5 },
      { id: 'tocineta', nombre: 'Tocineta', grupo: 'Proteínas', precio: 1.5 },
      { id: 'jamon', nombre: 'Jamón', grupo: 'Proteínas', precio: 1 },
      { id: 'huevo', nombre: 'Huevo', grupo: 'Proteínas', precio: 1 },
      { id: 'queso', nombre: 'Queso amarillo', grupo: 'Extras', precio: 1 },
      { id: 'papitas', nombre: 'Papitas', grupo: 'Extras', precio: 0.5 },
    ],
  },
  {
    id: 'perro',
    nombre: 'Perro caliente',
    lema: 'Salchicha jugosa en pan con ajonjolí, con repollo, papitas y salsas al gusto.',
    precioBase: 2.5,
    foto: '/img/perro.webp',
    deLaCasa: ['repollo', 'cebolla', 'ketchup', 'mostaza', 'mayonesa', 'papitas', 'queso-rallado'],
    ingredientes: [
      { id: 'ketchup', nombre: 'Ketchup', grupo: 'Salsas', precio: 0 },
      { id: 'mostaza', nombre: 'Mostaza', grupo: 'Salsas', precio: 0 },
      { id: 'mayonesa', nombre: 'Mayonesa', grupo: 'Salsas', precio: 0 },
      { id: 'repollo', nombre: 'Repollo', grupo: 'Vegetales', precio: 0 },
      { id: 'cebolla', nombre: 'Cebolla', grupo: 'Vegetales', precio: 0 },
      { id: 'papitas', nombre: 'Papitas', grupo: 'Extras', precio: 0.5 },
      { id: 'queso-rallado', nombre: 'Queso rallado', grupo: 'Extras', precio: 0.5 },
      { id: 'tocineta', nombre: 'Tocineta', grupo: 'Extras', precio: 1 },
    ],
  },
  {
    id: 'pizza',
    nombre: 'Pizza mediana',
    lema: 'Masa artesanal al horno, salsa de tomate y mozzarella que se derrite.',
    precioBase: 7,
    foto: '/img/pizza.webp',
    deLaCasa: ['salsa', 'queso', 'pepperoni', 'jamon', 'maiz', 'pimenton'],
    ingredientes: [
      { id: 'salsa', nombre: 'Salsa de tomate', grupo: 'Base', precio: 0 },
      { id: 'queso', nombre: 'Mozzarella', grupo: 'Base', precio: 0 },
      { id: 'pepperoni', nombre: 'Pepperoni', grupo: 'Toppings', precio: 1.5 },
      { id: 'jamon', nombre: 'Jamón', grupo: 'Toppings', precio: 1 },
      { id: 'maiz', nombre: 'Maíz', grupo: 'Toppings', precio: 0.5 },
      { id: 'pimenton', nombre: 'Pimentón', grupo: 'Toppings', precio: 0.5 },
      { id: 'cebolla', nombre: 'Cebolla', grupo: 'Toppings', precio: 0.5 },
      { id: 'aceitunas', nombre: 'Aceitunas', grupo: 'Toppings', precio: 1 },
    ],
  },
]

export const producto = (id: ProductoId) => PRODUCTOS.find((p) => p.id === id)!

export function precio(id: ProductoId, seleccion: Iterable<string>) {
  const p = producto(id)
  let total = p.precioBase
  for (const s of seleccion) total += p.ingredientes.find((i) => i.id === s)?.precio ?? 0
  return total
}

export const usd = (n: number) => `$${n.toFixed(2)}`
