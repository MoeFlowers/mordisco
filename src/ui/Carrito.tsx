import { useEffect, useRef, useState } from 'react'
import { precio, producto, usd } from '../data/menu'
import { diferencias, mensajeWhatsApp, type Linea } from '../estado'

export function Carrito({
  lineas,
  total,
  onCerrar,
  onEditar,
  onCantidad,
}: {
  lineas: Linea[]
  total: number
  onCerrar: () => void
  onEditar: (l: Linea) => void
  onCantidad: (uid: string, n: number) => void
}) {
  const [nombre, setNombre] = useState('')
  const [entrega, setEntrega] = useState<'delivery' | 'retiro'>('delivery')
  const [direccion, setDireccion] = useState('')
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cerrarRef.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="carrito-titulo">
      <button aria-label="Cerrar el pedido" onClick={onCerrar} className="absolute inset-0 cursor-default bg-black/55" tabIndex={-1} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-crema text-tinta shadow-2xl">
        <div className="flex items-center justify-between border-b border-crema-2 px-5 py-4">
          <h2 id="carrito-titulo" className="font-display text-2xl font-bold">
            Tu pedido
          </h2>
          <button ref={cerrarRef} onClick={onCerrar} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-crema-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {lineas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="font-display text-xl font-semibold">Todavía no hay nada aquí</p>
            <p className="text-tinta-suave">Elige una hamburguesa, un perro o una pizza y ármala a tu gusto.</p>
            <button onClick={onCerrar} className="mt-2 min-h-11 rounded-full bg-tomate px-6 font-semibold text-white hover:bg-tomate-hondo">
              Ver el menú
            </button>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-crema-2 overflow-y-auto px-5">
              {lineas.map((l) => {
                const p = producto(l.id)
                const { con, sin } = diferencias(l.id, l.sel)
                return (
                  <li key={l.uid} className="flex gap-4 py-4">
                    <img src={p.foto} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-carbon object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{p.nombre}</p>
                        <p className="font-semibold tabular-nums">{usd(precio(l.id, l.sel) * l.cantidad)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-tinta-suave">
                        {con.length || sin.length ? [con.length ? `Con ${con.join(', ').toLowerCase()}` : '', sin.length ? `sin ${sin.join(', ').toLowerCase()}` : ''].filter(Boolean).join('; ') : 'Como la de la casa'}
                      </p>
                      {l.nota && <p className="mt-0.5 text-sm text-tinta-suave">Nota: {l.nota}</p>}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-crema-2" role="group" aria-label={`Cantidad de ${p.nombre}`}>
                          <button onClick={() => onCantidad(l.uid, l.cantidad - 1)} aria-label={l.cantidad === 1 ? 'Quitar del pedido' : 'Quitar uno'} className="grid h-10 w-10 place-items-center rounded-full hover:bg-crema-2">
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold tabular-nums">{l.cantidad}</span>
                          <button onClick={() => onCantidad(l.uid, l.cantidad + 1)} aria-label="Agregar uno" className="grid h-10 w-10 place-items-center rounded-full hover:bg-crema-2">
                            +
                          </button>
                        </div>
                        <button onClick={() => onEditar(l)} className="min-h-10 rounded-full px-3 text-sm font-semibold text-tomate underline-offset-4 hover:underline">
                          Editar
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <form
              className="space-y-3 border-t border-crema-2 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault()
                window.open(mensajeWhatsApp(lineas, total, nombre, entrega, direccion), '_blank', 'noopener')
              }}
            >
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Entrega">
                {(['delivery', 'retiro'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    role="radio"
                    aria-checked={entrega === op}
                    onClick={() => setEntrega(op)}
                    className={`min-h-11 rounded-full border text-sm font-semibold transition ${entrega === op ? 'border-tinta bg-tinta text-crema' : 'border-crema-2 hover:border-tinta-suave'}`}
                  >
                    {op === 'delivery' ? 'Delivery' : 'Retiro en el local'}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Tu nombre</span>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-crema-2 bg-white px-4 py-2.5 text-base" />
              </label>
              {entrega === 'delivery' && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Dirección</span>
                  <input value={direccion} onChange={(e) => setDireccion(e.target.value)} autoComplete="street-address" className="w-full rounded-xl border border-crema-2 bg-white px-4 py-2.5 text-base" />
                </label>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-tinta-suave">Total</span>
                <span className="font-display text-2xl font-bold tabular-nums">{usd(total)}</span>
              </div>
              <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-tomate font-semibold text-white transition hover:bg-tomate-hondo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
                </svg>
                Pedir por WhatsApp
              </button>
              <p className="text-center text-sm text-tinta-suave">Se abre WhatsApp con tu pedido escrito. Mordisco es una demostración: elige a quién enviarlo.</p>
            </form>
          </>
        )}
      </aside>
    </div>
  )
}
