import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export const limitar = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const salidaCubica = (t: number) => 1 - Math.pow(1 - limitar(t), 3)
/** Rebote suave al final (como algo que cae y se asienta). */
export const salidaAtras = (t: number, k = 1.4) => {
  const x = limitar(t) - 1
  return 1 + (k + 1) * x * x * x + k * x * x
}

/**
 * Progreso 0..1 de un ingrediente: sube al activarlo y baja al quitarlo, a velocidad constante
 * (no amortiguado) para que las animaciones por tramos se vean completas.
 */
export function useProgreso(activo: boolean, duracion = 0.9) {
  const p = useRef(activo ? 1 : 0)
  useFrame((_, dt) => {
    const paso = Math.min(dt, 1 / 30) / duracion
    p.current = activo ? Math.min(1, p.current + paso) : Math.max(0, p.current - paso * 1.6)
  })
  return p
}

/** Distribución en espiral de girasol: reparte toppings sin amontonarlos. */
export function girasol(n: number, radio: number, semilla = 1) {
  const pts: THREE.Vector2[] = []
  const oro = Math.PI * (3 - Math.sqrt(5))
  let s = semilla
  const azar = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n) * radio
    const a = i * oro + azar() * 0.35
    pts.push(new THREE.Vector2(Math.cos(a) * r + (azar() - 0.5) * 0.04, Math.sin(a) * r + (azar() - 0.5) * 0.04))
  }
  return pts
}

export function azar(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}
