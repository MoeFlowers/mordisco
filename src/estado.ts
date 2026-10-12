import { useEffect, useRef, useState } from 'react'
import { precio, producto, usd, type ProductoId } from './data/menu'

export type Linea = { uid: string; id: ProductoId; sel: string[]; cantidad: number; nota: string }

const CLAVE = 'mordisco-pedido'

function leer(): Linea[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Pedido guardado en el navegador: si recargas la página no se pierde. */
export function usePedido() {
  const [lineas, setLineas] = useState<Linea[]>(leer)
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lineas))
    } catch {
      /* sin almacenamiento (modo privado): el pedido vive solo en esta pestaña */
    }
  }, [lineas])
  const guardar = (l: Omit<Linea, 'uid'> & { uid?: string }) =>
    setLineas((ls) => (l.uid && ls.some((x) => x.uid === l.uid) ? ls.map((x) => (x.uid === l.uid ? { ...x, ...l, uid: x.uid } : x)) : [...ls, { ...l, uid: crypto.randomUUID() }]))
  const cantidad = (uid: string, n: number) => setLineas((ls) => ls.flatMap((x) => (x.uid !== uid ? [x] : n <= 0 ? [] : [{ ...x, cantidad: n }])))
  const total = lineas.reduce((s, l) => s + precio(l.id, l.sel) * l.cantidad, 0)
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0)
  return { lineas, guardar, cantidad, vaciar: () => setLineas([]), total, unidades }
}

/** Qué cambió respecto a la versión de la casa: así el resumen es corto ("sin cebolla, + tocineta"). */
export function diferencias(id: ProductoId, sel: string[]) {
  const p = producto(id)
  const nombre = (i: string) => p.ingredientes.find((x) => x.id === i)?.nombre ?? i
  const con = sel.filter((s) => !p.deLaCasa.includes(s)).map(nombre)
  const sin = p.deLaCasa.filter((s) => !sel.includes(s)).map(nombre)
  return { con, sin }
}

export function mensajeWhatsApp(lineas: Linea[], total: number, nombre: string, entrega: string, direccion: string) {
  const partes = ['Hola, quiero hacer un pedido en Mordisco:', '']
  for (const l of lineas) {
    const p = producto(l.id)
    const { con, sin } = diferencias(l.id, l.sel)
    partes.push(`${l.cantidad} x ${p.nombre} (${usd(precio(l.id, l.sel) * l.cantidad)})`)
    if (con.length) partes.push(`   Con: ${con.join(', ')}`)
    if (sin.length) partes.push(`   Sin: ${sin.join(', ')}`)
    if (!con.length && !sin.length) partes.push('   Como la de la casa')
    if (l.nota.trim()) partes.push(`   Nota: ${l.nota.trim()}`)
  }
  partes.push('', `Total: ${usd(total)}`)
  if (nombre.trim()) partes.push(`Nombre: ${nombre.trim()}`)
  partes.push(entrega === 'delivery' ? `Delivery a: ${direccion.trim() || '(por confirmar)'}` : 'Retiro en el local')
  return `https://wa.me/?text=${encodeURIComponent(partes.join('\n'))}`
}

/**
 * Arma el producto pieza a pieza (como en la cocina): devuelve la selección que va creciendo.
 * Si 'instantaneo', entrega la selección completa sin animar (al editar algo del pedido).
 */
export function useArmado(ids: string[], clave: string, instantaneo = false) {
  const [sel, setSel] = useState<Set<string>>(() => new Set(instantaneo ? ids : []))
  const timers = useRef<number[]>([])
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (instantaneo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSel(new Set(ids))
      return
    }
    setSel(new Set())
    ids.forEach((id, i) => {
      timers.current.push(window.setTimeout(() => setSel((s) => new Set(s).add(id)), 450 + i * 420))
    })
    return () => timers.current.forEach(clearTimeout)
    // 'clave' cambia cuando se abre otro producto: entonces se vuelve a armar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return [sel, setSel] as const
}
