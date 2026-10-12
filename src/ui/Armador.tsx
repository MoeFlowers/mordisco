import { useEffect, useMemo, useRef, useState } from 'react'
import { precio, producto, usd, type ProductoId } from '../data/menu'
import { useArmado, type Linea } from '../estado'
import { Escena } from '../three/Escena'

export type Apertura = { id: ProductoId; linea?: Linea }

export function Armador({ apertura, onCerrar, onGuardar }: { apertura: Apertura; onCerrar: () => void; onGuardar: (l: Omit<Linea, 'uid'> & { uid?: string }) => void }) {
  const p = producto(apertura.id)
  const editando = !!apertura.linea
  const inicial = apertura.linea?.sel ?? p.deLaCasa
  const [sel, setSel] = useArmado(inicial, `${apertura.id}-${apertura.linea?.uid ?? 'nuevo'}`, editando)
  const [cantidad, setCantidad] = useState(apertura.linea?.cantidad ?? 1)
  const [nota, setNota] = useState(apertura.linea?.nota ?? '')
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', tecla)
    }
  }, [onCerrar])

  const grupos = useMemo(() => {
    const m = new Map<string, typeof p.ingredientes>()
    for (const i of p.ingredientes) m.set(i.grupo, [...(m.get(i.grupo) ?? []), i])
    return [...m]
  }, [p])

  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const unitario = precio(p.id, sel)

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="armador-titulo" className="fixed inset-0 z-50 flex flex-col bg-carbon lg:grid lg:grid-cols-[1fr_420px]">
      <div className="relative h-[44vh] shrink-0 lg:h-auto">
        <Escena producto={p.id} sel={sel} rotar={false} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
          <div>
            <p className="font-display text-sm font-semibold tracking-wide text-mostaza">Arma tu pedido</p>
            <h2 id="armador-titulo" className="font-display text-2xl font-bold sm:text-3xl">
              {p.nombre}
            </h2>
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-sm text-claro-suave">Arrastra para girar</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-carbon-3 bg-carbon-2 lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between px-5 pt-4 sm:px-6">
          <p className="text-sm text-claro-suave">Toca un ingrediente para ponerlo o quitarlo</p>
          <button ref={cerrarRef} onClick={onCerrar} aria-label="Cerrar" className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-claro-suave transition hover:bg-carbon-3 hover:text-claro">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-3 pb-5 sm:px-6">
          {grupos.map(([grupo, items]) => (
            <fieldset key={grupo}>
              <legend className="mb-2 font-display text-base font-semibold">{grupo}</legend>
              <div className="flex flex-wrap gap-2">
                {items.map((i) => {
                  const activo = sel.has(i.id)
                  return (
                    <button
                      key={i.id}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => alternar(i.id)}
                      className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        activo ? 'border-mostaza bg-mostaza/15 text-claro' : 'border-carbon-3 bg-carbon text-claro-suave hover:border-claro-suave/50 hover:text-claro'
                      }`}
                    >
                      <span aria-hidden="true" className={`grid h-4 w-4 place-items-center rounded-full border ${activo ? 'border-mostaza bg-mostaza text-carbon' : 'border-claro-suave/60'}`}>
                        {activo && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 6.2l2.3 2.3 4.7-4.9" />
                          </svg>
                        )}
                      </span>
                      {i.nombre}
                      {i.precio > 0 && <span className="text-claro-suave">+{usd(i.precio)}</span>}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div>
            <label htmlFor="nota" className="mb-2 block font-display text-base font-semibold">
              Nota para la cocina
            </label>
            <textarea
              id="nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Ej: carne bien cocida, salsas aparte"
              className="w-full resize-none rounded-xl border border-carbon-3 bg-carbon px-4 py-3 text-base text-claro placeholder:text-claro-suave/70"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-carbon-3 px-5 py-4 sm:px-6">
          <div className="flex items-center rounded-full border border-carbon-3" role="group" aria-label="Cantidad">
            <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Quitar uno" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-carbon-3">
              −
            </button>
            <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
              {cantidad}
            </span>
            <button onClick={() => setCantidad((c) => Math.min(20, c + 1))} aria-label="Agregar uno" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-carbon-3">
              +
            </button>
          </div>
          <button
            onClick={() => onGuardar({ uid: apertura.linea?.uid, id: p.id, sel: [...sel], cantidad, nota })}
            className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-full bg-tomate px-5 font-semibold text-white transition hover:bg-tomate-hondo"
          >
            <span>{editando ? 'Guardar' : 'Agregar'}<span className="hidden sm:inline">{editando ? ' cambios' : ' al pedido'}</span></span>
            <span className="tabular-nums">{usd(unitario * cantidad)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
