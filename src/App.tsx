import { lazy, Suspense, useCallback, useState } from 'react'
import { PRODUCTOS, producto, usd, type ProductoId } from './data/menu'
import { useArmado, usePedido, type Linea } from './estado'
import type { Apertura } from './ui/Armador'
import { Carrito } from './ui/Carrito'

const Escena = lazy(() => import('./three/Escena').then((m) => ({ default: m.Escena })))
const Armador = lazy(() => import('./ui/Armador').then((m) => ({ default: m.Armador })))

function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 3a13 13 0 1 0 12.6 16.2 3.4 3.4 0 0 1-3.3-4.6 3.4 3.4 0 0 1-2.9-5.4A3.4 3.4 0 0 1 19.3 3.4 13 13 0 0 0 16 3z" fill="#E3A73D" />
    </svg>
  )
}

function Cabecera({ unidades, total, onCarrito }: { unidades: number; total: number; onCarrito: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-carbon-3/70 bg-carbon/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">Mordisco</span>
        </a>
        <nav aria-label="Secciones" className="hidden items-center gap-1 text-sm font-medium text-claro-suave md:flex">
          {[
            ['#menu', 'Menú'],
            ['#como', 'Cómo pedir'],
            ['#horario', 'Horario y pagos'],
          ].map(([href, t]) => (
            <a key={href} href={href} className="rounded-full px-3 py-2 transition hover:bg-carbon-2 hover:text-claro">
              {t}
            </a>
          ))}
        </nav>
        <button onClick={onCarrito} className="flex min-h-11 items-center gap-2 rounded-full border border-carbon-3 px-4 text-sm font-semibold transition hover:border-claro-suave/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1 13H7L6 7z" />
            <path d="M9 7a3 3 0 0 1 6 0" />
          </svg>
          <span>Pedido</span>
          {unidades > 0 && (
            <span className="rounded-full bg-mostaza px-2 py-0.5 text-xs font-bold text-carbon tabular-nums">
              {unidades} · {usd(total)}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

function Hero({ onArmar }: { onArmar: (id: ProductoId) => void }) {
  const [id, setId] = useState<ProductoId>('hamburguesa')
  const p = producto(id)
  const [sel] = useArmado(p.deLaCasa, `hero-${id}`)
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 pt-4 pb-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-6 lg:py-16">
        {/* En móvil el producto va primero: es lo que engancha */}
        <div className="order-2 lg:order-1">
          <p className="font-display text-sm font-semibold tracking-wide text-mostaza">Hamburguesas · Perros calientes · Pizzas</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">Ármala a tu gusto y mírala antes de pedirla.</h1>
          <p className="mt-4 max-w-md text-lg text-claro-suave">Elige cada ingrediente y míralo caer en su sitio. Cuando te guste cómo quedó, la pides por WhatsApp.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onArmar(id)} className="min-h-12 rounded-full bg-tomate px-6 font-semibold text-white transition hover:bg-tomate-hondo">
              Armar {id === 'perro' ? 'mi perro' : id === 'pizza' ? 'mi pizza' : 'mi hamburguesa'}
            </button>
            <a href="#menu" className="flex min-h-12 items-center rounded-full border border-carbon-3 px-6 font-semibold transition hover:border-claro-suave/60">
              Ver el menú
            </a>
          </div>
        </div>
        <div className="relative order-1 lg:order-2">
          <div className="h-[40vh] min-h-[280px] lg:h-[560px]">
            <Suspense fallback={<div className="grid h-full place-items-center text-claro-suave">Encendiendo la plancha…</div>}>
              <Escena producto={id} sel={sel} arrastrar={false} />
            </Suspense>
          </div>
          <div className="mt-2 flex justify-center gap-2" role="tablist" aria-label="Producto">
            {PRODUCTOS.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={x.id === id}
                onClick={() => setId(x.id)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${x.id === id ? 'bg-claro text-carbon' : 'text-claro-suave hover:bg-carbon-2 hover:text-claro'}`}
              >
                {x.nombre.replace(' mediana', '')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Menu({ onArmar }: { onArmar: (id: ProductoId) => void }) {
  return (
    <section id="menu" className="bg-crema text-tinta">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">El menú</h2>
        <p className="mt-2 max-w-xl text-lg text-tinta-suave">Tres clásicos de la calle, hechos al momento. Cada uno trae su versión de la casa y la puedes cambiar toda.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTOS.map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgba(42,33,28,0.06),0_12px_32px_-18px_rgba(42,33,28,0.35)]">
              <img src={p.foto} alt={`${p.nombre} de la casa`} className="aspect-[4/3] w-full bg-carbon object-cover" loading="lazy" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl font-bold">{p.nombre}</h3>
                  <p className="font-semibold whitespace-nowrap text-tinta-suave">
                    desde <span className="text-tinta">{usd(p.precioBase)}</span>
                  </p>
                </div>
                <p className="mt-2 flex-1 text-tinta-suave">{p.lema}</p>
                <button onClick={() => onArmar(p.id)} className="mt-5 min-h-12 rounded-full bg-tomate font-semibold text-white transition hover:bg-tomate-hondo">
                  Armar {p.id === 'perro' ? 'el mío' : 'la mía'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComoPedir() {
  const pasos = [
    ['Elige', 'Hamburguesa, perro caliente o pizza. Empiezas con la versión de la casa.'],
    ['Ármala', 'Pon y quita ingredientes y mira en 3D cómo queda. El precio cambia al instante.'],
    ['Pídela', 'Revisa tu pedido, cambia lo que quieras y envíalo por WhatsApp.'],
  ]
  return (
    <section id="como" className="bg-crema-2 text-tinta">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Cómo pedir</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {pasos.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-tinta font-display text-lg font-bold text-crema">{i + 1}</span>
              <div>
                <h3 className="font-display text-xl font-bold">{t}</h3>
                <p className="mt-1 text-tinta-suave">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Horario() {
  const bloques = [
    ['Horario', 'Todos los días, de 5:00 p. m. a 12:00 a. m.'],
    ['Pagos', 'Divisas, pago móvil y punto de venta.'],
    ['Entrega', 'Delivery en la zona o retiro en el local.'],
  ]
  return (
    <section id="horario">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
        {bloques.map(([t, d]) => (
          <div key={t}>
            <h2 className="font-display text-xl font-bold text-mostaza">{t}</h2>
            <p className="mt-2 text-lg text-claro">{d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const pedido = usePedido()
  const [apertura, setApertura] = useState<Apertura | null>(null)
  const [carrito, setCarrito] = useState(false)
  const cerrarArmador = useCallback(() => setApertura(null), [])
  const cerrarCarrito = useCallback(() => setCarrito(false), [])

  return (
    <>
      <Cabecera unidades={pedido.unidades} total={pedido.total} onCarrito={() => setCarrito(true)} />
      <main>
        <Hero onArmar={(id) => setApertura({ id })} />
        <Menu onArmar={(id) => setApertura({ id })} />
        <ComoPedir />
        <Horario />
      </main>
      <footer className="border-t border-carbon-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-claro-suave sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2">
            <Logo className="h-5 w-5" /> Mordisco
          </span>
          <span>Concepto de diseño: marca, precios y datos ficticios.</span>
        </div>
      </footer>

      {pedido.unidades > 0 && !carrito && !apertura && (
        <button
          onClick={() => setCarrito(true)}
          className="fixed inset-x-4 bottom-4 z-30 flex min-h-14 items-center justify-between rounded-full bg-tomate px-6 font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] md:hidden"
        >
          <span>Ver pedido ({pedido.unidades})</span>
          <span className="tabular-nums">{usd(pedido.total)}</span>
        </button>
      )}

      {apertura && (
        <Suspense fallback={null}>
          <Armador
            apertura={apertura}
            onCerrar={cerrarArmador}
            onGuardar={(l) => {
              pedido.guardar(l)
              setApertura(null)
              setCarrito(true)
            }}
          />
        </Suspense>
      )}
      {carrito && (
        <Carrito
          lineas={pedido.lineas}
          total={pedido.total}
          onCerrar={cerrarCarrito}
          onCantidad={pedido.cantidad}
          onEditar={(l: Linea) => {
            setCarrito(false)
            setApertura({ id: l.id, linea: l })
          }}
        />
      )}
    </>
  )
}
